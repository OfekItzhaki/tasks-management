import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ListSharesService } from './list-shares.service';
import { ShareListDto } from './dto/share-list.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('list-shares')
export class ListSharesController {
  constructor(private readonly listSharesService: ListSharesService) {}

  @Post('todo-list/:todoListId')
  shareList(
    @Param('todoListId', ParseIntPipe) todoListId: number,
    @Body() shareListDto: ShareListDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.listSharesService.shareList(todoListId, shareListDto, user.userId);
  }

  @Get('user/:userId')
  getSharedLists(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (user.userId !== userId) {
      throw new ForbiddenException("Cannot view another user's shares");
    }
    return this.listSharesService.getSharedLists(userId);
  }

  @Get('todo-list/:todoListId')
  getListShares(
    @Param('todoListId', ParseIntPipe) todoListId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.listSharesService.getListShares(todoListId, user.userId);
  }

  @Delete('todo-list/:todoListId/user/:userId')
  unshareList(
    @Param('todoListId', ParseIntPipe) todoListId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.listSharesService.unshareList(todoListId, userId, user.userId);
  }
}



