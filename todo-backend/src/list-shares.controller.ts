import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ListSharesService } from './list-shares.service';
import { ShareListDto } from './dto/share-list.dto';

@Controller('list-shares')
export class ListSharesController {
  constructor(private readonly listSharesService: ListSharesService) {}

  @Post('todo-list/:todoListId')
  shareList(
    @Param('todoListId', ParseIntPipe) todoListId: number,
    @Body() shareListDto: ShareListDto,
  ) {
    return this.listSharesService.shareList(todoListId, shareListDto);
  }

  @Get('user/:userId')
  getSharedLists(@Param('userId', ParseIntPipe) userId: number) {
    return this.listSharesService.getSharedLists(userId);
  }

  @Get('todo-list/:todoListId')
  getListShares(@Param('todoListId', ParseIntPipe) todoListId: number) {
    return this.listSharesService.getListShares(todoListId);
  }

  @Delete('todo-list/:todoListId/user/:userId')
  unshareList(
    @Param('todoListId', ParseIntPipe) todoListId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.listSharesService.unshareList(todoListId, userId);
  }
}


