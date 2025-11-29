import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import UsersService from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/current-user.decorator';

@Controller('users')
class UsersController {
  constructor(private userService: UsersService) {}

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.createUser(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getAllUsers(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.userService.getUser(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.userService.updateUser(id, data, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.userService.deleteUser(id, user.userId);
  }
}
export default UsersController;
