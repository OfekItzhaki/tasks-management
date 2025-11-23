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
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { ReorderStepsDto } from './dto/reorder-steps.dto';
import { StepsService } from './steps.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @Post('tasks/:taskId/steps')
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() createStepDto: CreateStepDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.stepsService.create(taskId, createStepDto, user.userId);
  }

  @Get('tasks/:taskId/steps')
  findAll(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.stepsService.findAll(taskId, user.userId);
  }

  @Patch('steps/:id')
  update(
    @Param('id', ParseIntPipe) stepId: number,
    @Body() updateStepDto: UpdateStepDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.stepsService.update(stepId, updateStepDto, user.userId);
  }

  @Delete('steps/:id')
  remove(
    @Param('id', ParseIntPipe) stepId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.stepsService.remove(stepId, user.userId);
  }

  @Patch('tasks/:taskId/steps/reorder')
  reorder(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() { stepIds }: ReorderStepsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.stepsService.reorder(taskId, user.userId, stepIds);
  }
}

