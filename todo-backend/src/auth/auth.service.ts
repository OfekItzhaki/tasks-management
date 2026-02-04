import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import UsersService from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) {
      this.logger.debug(`Login failed: no user or hash for email=${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      this.logger.debug(`Login failed: invalid password for userId=${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, email: user.email };

    this.logger.log(`User logged in: userId=${user.id} email=${user.email}`);

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async registerStart(email: string) {
    try {
      this.logger.debug(`registerStart: email=${email}`);
      const user = await this.usersService.initUser(email);
      this.logger.debug(`registerStart: user initialized, id=${user.id}`);

      try {
        await this.usersService.sendOtp(
          user.email,
          user.emailVerificationOtp!,
          user.name || undefined,
        );
      } catch (emailError) {
        this.logger.warn(
          `Failed to send OTP email to ${email}, but proceeding: ${emailError.message}`,
        );
      }

      this.logger.log(`Registration started: email=${email}`);
      return { message: 'OTP sent' };
    } catch (error) {
      this.logger.error(
        `registerStart failed for email=${email}:`,
        error.stack,
      );
      throw error;
    }
  }

  async registerVerify(email: string, otp: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.emailVerificationOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }
    const now = new Date();
    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt < now
    ) {
      throw new BadRequestException('OTP expired');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      purpose: 'registration',
    };
    return {
      registrationToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
    };
  }

  async registerFinish(token: string, password: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.purpose !== 'registration') {
        throw new BadRequestException('Invalid token');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await this.usersService.setPassword(
        payload.sub,
        passwordHash,
      );

      return this.login(user.email, password);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid or expired registration token');
    }
  }
}
