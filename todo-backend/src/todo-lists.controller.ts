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
import { TodoListsService } from './todo-lists.service';
import { CreateToDoListDto } from './dto/create-todo-list.dto';
import { UpdateToDoListDto } from './dto/update-todo-list.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from './auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('todo-lists')
export class TodoListsController {
  constructor(private readonly todoListsService: TodoListsService) {}

  @Post()
  create(
    @Body() createToDoListDto: CreateToDoListDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.todoListsService.create(createToDoListDto, user.userId);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.todoListsService.findAll(user.userId);
  }

  @Get('defaults')
  getDefaultLists(@CurrentUser() user: CurrentUserPayload) {
    return this.todoListsService.getDefaultLists(user.userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.todoListsService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateToDoListDto: UpdateToDoListDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.todoListsService.update(id, updateToDoListDto, user.userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.todoListsService.remove(id, user.userId);
  }
}



