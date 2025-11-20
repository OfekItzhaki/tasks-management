import { Controller, Get, Post, Delete, Patch, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import UsersService from './users.service';

@Controller('users')
class UsersController {
    constructor(private userService: UsersService) {}

    @Get()
    async getUsers() { 
        return this.userService.getAllUsers();
    }

    @Get(':id')
    async getUser(@Param('id', ParseIntPipe) id: number) { 
        return this.userService.getUser(id);
    }

    @Post()
    async createUser(@Body() data: CreateUserDto) {
        return this.userService.createUser(data);
    }

    @Patch(':id')
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: UpdateUserDto,
    ) {
        return this.userService.updateUser(id, data);
    }

    @Delete(':id')
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        return this.userService.deleteUser(id);
    }
}
export default UsersController;

