import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from './events.gateway';

describe('EventsService', () => {
  let service: EventsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prismaService: PrismaService;
  let eventsGateway: EventsGateway;

  const mockPrismaService = {
    task: {
      findUnique: jest.fn(),
    },
    toDoList: {
      findUnique: jest.fn(),
    },
  };

  const mockEventsGateway = {
    sendToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventsGateway = module.get<EventsGateway>(EventsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('broadcastTaskEvent', () => {
    it('should broadcast event to task owner and shared users', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        todoList: {
          id: 'list-1',
          ownerId: 'owner-1',
          shares: [{ sharedWithId: 'user-2' }, { sharedWithId: 'user-3' }],
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await service.broadcastTaskEvent('task-1', 'task-updated', {
        taskId: 'task-1',
      });

      // Should send to owner
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledWith(
        'owner-1',
        'task-updated',
        { taskId: 'task-1' },
      );

      // Should send to shared users
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledWith(
        'user-2',
        'task-updated',
        { taskId: 'task-1' },
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledWith(
        'user-3',
        'task-updated',
        { taskId: 'task-1' },
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledTimes(3);
    });

    it('should handle task without shares', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        todoList: {
          id: 'list-1',
          ownerId: 'owner-1',
          shares: [],
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await service.broadcastTaskEvent('task-1', 'task-updated', {
        taskId: 'task-1',
      });

      // Should only send to owner
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledWith(
        'owner-1',
        'task-updated',
        { taskId: 'task-1' },
      );
    });

    it('should handle task not found gracefully', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await service.broadcastTaskEvent('nonexistent', 'task-updated', {});

      // Should not send any events
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).not.toHaveBeenCalled();
    });

    it('should handle task without todoList gracefully', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        todoList: null,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await service.broadcastTaskEvent('task-1', 'task-updated', {});

      // Should not send any events
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.task.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw
      await expect(
        service.broadcastTaskEvent('task-1', 'task-updated', {}),
      ).resolves.not.toThrow();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).not.toHaveBeenCalled();
    });
  });

  describe('broadcastListEvent', () => {
    it('should broadcast event to list owner and shared users', async () => {
      const mockList = {
        id: 'list-1',
        title: 'Test List',
        ownerId: 'owner-1',
        shares: [{ sharedWithId: 'user-2' }, { sharedWithId: 'user-3' }],
      };

      mockPrismaService.toDoList.findUnique.mockResolvedValue(mockList);

      await service.broadcastListEvent('list-1', 'list-updated', {
        listId: 'list-1',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledTimes(3);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledWith(
        'owner-1',
        'list-updated',
        { listId: 'list-1' },
      );
    });

    it('should handle list not found gracefully', async () => {
      mockPrismaService.toDoList.findUnique.mockResolvedValue(null);

      await service.broadcastListEvent('nonexistent', 'list-updated', {});

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).not.toHaveBeenCalled();
    });

    it('should deduplicate user IDs', async () => {
      const mockList = {
        id: 'list-1',
        title: 'Test List',
        ownerId: 'user-1',
        shares: [
          { sharedWithId: 'user-1' }, // Same as owner
          { sharedWithId: 'user-2' },
        ],
      };

      mockPrismaService.toDoList.findUnique.mockResolvedValue(mockList);

      await service.broadcastListEvent('list-1', 'list-updated', {});

      // Should only send to each user once
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('broadcastStepEvent', () => {
    it('should delegate to broadcastTaskEvent', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        todoList: {
          id: 'list-1',
          ownerId: 'owner-1',
          shares: [],
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await service.broadcastStepEvent('task-1', 'step-updated', {
        stepId: 'step-1',
      });

      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        include: {
          todoList: {
            include: {
              shares: {
                select: { sharedWithId: true },
              },
            },
          },
        },
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(eventsGateway.sendToUser).toHaveBeenCalledWith(
        'owner-1',
        'step-updated',
        { stepId: 'step-1' },
      );
    });
  });
});
