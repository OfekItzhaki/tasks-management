import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksByDateDto } from './dto/get-tasks-by-date.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('todo-list/:todoListId')
  create(
    @Param('todoListId', ParseIntPipe) todoListId: number,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(todoListId, createTaskDto);
  }

  @Get()
  findAll(@Query('todoListId') todoListId?: string) {
    const listId = todoListId ? parseInt(todoListId, 10) : undefined;
    return this.tasksService.findAll(listId);
  }

  @Get('by-date')
  getTasksByDate(@Query() query: GetTasksByDateDto) {
    const date = query.date ? new Date(query.date) : new Date();
    return this.tasksService.getTasksByDate(date);
  }

  @Get('reminders')
  getTasksWithReminders(@Query() query: GetTasksByDateDto) {
    const date = query.date ? new Date(query.date) : new Date();
    return this.tasksService.getTasksWithReminders(date);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }
}


