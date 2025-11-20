import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { TodoListsService } from './todo-lists.service';
import { CreateToDoListDto } from './dto/create-todo-list.dto';
import { UpdateToDoListDto } from './dto/update-todo-list.dto';

@Controller('todo-lists')
export class TodoListsController {
  constructor(private readonly todoListsService: TodoListsService) {}

  @Post()
  create(@Body() createToDoListDto: CreateToDoListDto) {
    return this.todoListsService.create(createToDoListDto);
  }

  @Get()
  findAll() {
    return this.todoListsService.findAll();
  }

  @Get('defaults')
  getDefaultLists() {
    return this.todoListsService.getDefaultLists();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.todoListsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateToDoListDto: UpdateToDoListDto,
  ) {
    return this.todoListsService.update(id, updateToDoListDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.todoListsService.remove(id);
  }
}


