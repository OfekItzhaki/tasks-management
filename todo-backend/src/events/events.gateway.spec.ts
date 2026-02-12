import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let jwtService: JwtService;

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should track user connection with valid token', () => {
      const mockSocket = {
        id: 'socket-1',
        handshake: {
          auth: {
            token: 'valid-token',
          },
          headers: {},
        },
        emit: jest.fn(),
        data: {},
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });

      gateway.handleConnection(mockSocket);

      // Verify JWT was checked
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');

      // User should be tracked
      const userSockets = gateway['userSockets'].get('user-1');
      expect(userSockets).toBeDefined();
      expect(userSockets?.includes('socket-1')).toBe(true);
    });

    it('should handle connection without token', () => {
      const mockSocket = {
        id: 'socket-1',
        handshake: {
          auth: {},
          headers: {},
        },
        emit: jest.fn(),
        disconnect: jest.fn(),
        data: {},
      } as unknown as Socket;

      gateway.handleConnection(mockSocket);

      // Should not track user
      expect(gateway['userSockets'].size).toBe(0);
    });

    it('should handle invalid token', () => {
      const mockSocket = {
        id: 'socket-1',
        handshake: {
          auth: {
            token: 'invalid-token',
          },
          headers: {},
        },
        emit: jest.fn(),
        disconnect: jest.fn(),
        data: {},
      } as unknown as Socket;

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      gateway.handleConnection(mockSocket);

      // Should not track user
      expect(gateway['userSockets'].size).toBe(0);
    });

    it('should track multiple sockets for same user', () => {
      const mockSocket1 = {
        id: 'socket-1',
        handshake: { auth: { token: 'token-1' }, headers: {} },
        emit: jest.fn(),
        data: {},
      } as unknown as Socket;

      const mockSocket2 = {
        id: 'socket-2',
        handshake: { auth: { token: 'token-2' }, headers: {} },
        emit: jest.fn(),
        data: {},
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });

      gateway.handleConnection(mockSocket1);
      gateway.handleConnection(mockSocket2);

      const userSockets = gateway['userSockets'].get('user-1');
      expect(userSockets?.length).toBe(2);
      expect(userSockets?.includes('socket-1')).toBe(true);
      expect(userSockets?.includes('socket-2')).toBe(true);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove socket from tracking on disconnect', () => {
      const mockSocket = {
        id: 'socket-1',
        handshake: { auth: { token: 'valid-token' }, headers: {} },
        emit: jest.fn(),
        data: {},
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });

      gateway.handleConnection(mockSocket);
      gateway.handleDisconnect(mockSocket);
      expect(gateway['userSockets'].get('user-1')?.includes('socket-1')).not.toBe(true);
    });

    it('should remove user entry when last socket disconnects', () => {
      const mockSocket = {
        id: 'socket-1',
        handshake: { auth: { token: 'valid-token' }, headers: {} },
        emit: jest.fn(),
        data: {},
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });

      gateway.handleConnection(mockSocket);
      gateway.handleDisconnect(mockSocket);

      // User entry should be removed
      expect(gateway['userSockets'].has('user-1')).toBe(false);
    });

    it('should keep user entry when other sockets remain', () => {
      const mockSocket1 = {
        id: 'socket-1',
        handshake: { auth: { token: 'token-1' }, headers: {} },
        emit: jest.fn(),
        data: {},
      } as unknown as Socket;

      const mockSocket2 = {
        id: 'socket-2',
        handshake: { auth: { token: 'token-2' }, headers: {} },
        emit: jest.fn(),
        data: {},
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });

      gateway.handleConnection(mockSocket1);
      gateway.handleConnection(mockSocket2);
      gateway.handleDisconnect(mockSocket1);

      // User should still be tracked
      expect(gateway['userSockets'].has('user-1')).toBe(true);
      expect(gateway['userSockets'].get('user-1')?.length).toBe(1);
    });
  });

  describe('sendToUser', () => {
    it('should send event to all user sockets', () => {
      const mockSocket1 = {
        id: 'socket-1',
        handshake: { auth: { token: 'token-1' }, headers: {} },
        emit: jest.fn(),
        data: {},
      } as unknown as Socket;

      const mockSocket2 = {
        id: 'socket-2',
        handshake: { auth: { token: 'token-2' }, headers: {} },
        emit: jest.fn(),
        data: {},
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });

      gateway.handleConnection(mockSocket1);
      gateway.handleConnection(mockSocket2);

      // Mock the server.to() chain
      const mockTo = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
      gateway['server'] = { to: mockTo } as any;

      gateway.sendToUser('user-1', 'test-event', { data: 'test' });

      expect(mockTo).toHaveBeenCalledWith('socket-1');
      expect(mockTo).toHaveBeenCalledWith('socket-2');
      expect(mockTo).toHaveBeenCalledTimes(2);
    });

    it('should handle sending to non-existent user', () => {
      const mockTo = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
      gateway['server'] = { to: mockTo } as any;

      // Should not throw
      expect(() => {
        gateway.sendToUser('nonexistent-user', 'test-event', {});
      }).not.toThrow();

      expect(mockTo).not.toHaveBeenCalled();
    });
  });
});
