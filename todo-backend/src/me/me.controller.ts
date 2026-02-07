import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/current-user.decorator';
import { GetTodoListsQuery } from '../todo-lists/queries/get-todo-lists.query';
import { GetTasksQuery } from '../tasks/queries/get-tasks.query';
import { GetTrashQuery } from './queries/get-trash.query';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UpdateProfilePictureCommand } from './commands/update-profile-picture.command';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('lists')
  @ApiOperation({ summary: 'Get my lists (alias for GET /todo-lists)' })
  @ApiResponse({ status: 200, description: 'Returns all user lists' })
  getMyLists(@CurrentUser() user: CurrentUserPayload) {
    return this.queryBus.execute(new GetTodoListsQuery(user.userId));
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get my tasks (alias for GET /tasks)' })
  @ApiQuery({
    name: 'todoListId',
    required: false,
    type: String,
    description: 'Filter tasks by list ID',
  })
  @ApiResponse({ status: 200, description: 'Returns user tasks' })
  getMyTasks(
    @CurrentUser() user: CurrentUserPayload,
    @Query('todoListId') todoListId?: string,
  ) {
    return this.queryBus.execute(new GetTasksQuery(user.userId, todoListId));
  }

  @Get('trash')
  @ApiOperation({ summary: 'Get deleted lists and tasks for recovery' })
  @ApiResponse({ status: 200, description: 'Returns all soft-deleted items' })
  getTrash(@CurrentUser() user: CurrentUserPayload) {
    return this.queryBus.execute(new GetTrashQuery(user.userId));
  }

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update profile picture' })
  @ApiResponse({
    status: 200,
    description: 'Profile picture updated successfully',
  })
  updateProfilePicture(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.commandBus.execute(
      new UpdateProfilePictureCommand(user.userId, file),
    );
  }
}
