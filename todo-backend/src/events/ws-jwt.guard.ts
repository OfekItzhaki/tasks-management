import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private logger = new Logger('WsJwtGuard');

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const client: any = context.switchToWs().getClient();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const handshake = client.handshake as unknown as {
        auth: { token?: string };
        headers: { authorization?: string };
      };

      const token =
        handshake.auth.token ||
        (typeof handshake.headers.authorization === 'string'
          ? handshake.headers.authorization.split(' ')[1]
          : undefined);

      if (!token) {
        throw new WsException('No token provided');
      }

      const payload: unknown = await this.jwtService.verifyAsync(token);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const clientData = client.data as unknown as { user?: unknown };
      clientData.user = payload;

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`WS Authentication failed: ${errorMessage}`);
      throw new WsException('Unauthorized access');
    }
  }
}
