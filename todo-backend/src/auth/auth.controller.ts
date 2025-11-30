import { Body, Controller, Post, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import UsersService from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.usersService.resendVerificationEmail(resendVerificationDto.email);
  }
}
