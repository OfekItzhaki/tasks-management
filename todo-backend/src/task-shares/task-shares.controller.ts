import { Controller, Post, Get, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TaskSharesService } from './task-shares.service';
import { ShareTaskDto } from './dto/share-task.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShareRole } from '@prisma/client';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@ApiTags('task-shares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('task-shares')
export class TaskSharesController {
  constructor(private readonly taskSharesService: TaskSharesService) {}

  @Post(':taskId/share')
  @ApiOperation({ summary: 'Share a task with another user' })
  async shareTask(
    @Param('taskId') taskId: string,
    @Body() shareTaskDto: ShareTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.taskSharesService.shareTask(taskId, shareTaskDto, user.userId);
  }

  @Get(':taskId/shares')
  @ApiOperation({ summary: 'Get all shares for a specific task' })
  async getTaskShares(@Param('taskId') taskId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.taskSharesService.getTaskShares(taskId, user.userId);
  }

  @Delete(':taskId/share/:userId')
  @ApiOperation({ summary: 'Remove a user from task sharing' })
  async unshareTask(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.taskSharesService.unshareTask(taskId, userId, user.userId);
  }

  @Patch(':taskId/share/:userId/role')
  @ApiOperation({ summary: 'Update a user role for a shared task' })
  async updateShareRole(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
    @Body('role') role: ShareRole,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.taskSharesService.updateShareRole(taskId, userId, role, user.userId);
  }

  @Get('my-shared-tasks')
  @ApiOperation({ summary: 'Get all tasks shared with the current user' })
  async getTasksSharedWithMe(@CurrentUser() user: CurrentUserPayload) {
    return this.taskSharesService.getTasksSharedWithMe(user.userId);
  }
}
