import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksByDateDto } from './dto/get-tasks-by-date.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from './auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('todo-list/:todoListId')
  create(
    @Param('todoListId', ParseIntPipe) todoListId: number,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.create(todoListId, createTaskDto, user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('todoListId') todoListId?: string,
  ) {
    const listId = todoListId ? parseInt(todoListId, 10) : undefined;
    return this.tasksService.findAll(user.userId, listId);
  }

  @Get('by-date')
  getTasksByDate(
    @Query() query: GetTasksByDateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const date = query.date ? new Date(query.date) : new Date();
    return this.tasksService.getTasksByDate(user.userId, date);
  }

  @Get('reminders')
  getTasksWithReminders(
    @Query() query: GetTasksByDateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const date = query.date ? new Date(query.date) : new Date();
    return this.tasksService.getTasksWithReminders(user.userId, date);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.update(id, updateTaskDto, user.userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.remove(id, user.userId);
  }
}



