import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskBehavior, CompletionPolicy } from '@prisma/client';

export class UpdateToDoListDto {
  @ApiPropertyOptional({
    description: 'Name of the to-do list',
    example: 'Updated List Name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Task behavior (Recurring vs One-off)',
    enum: TaskBehavior,
  })
  @IsEnum(TaskBehavior)
  @IsOptional()
  taskBehavior?: TaskBehavior;

  @ApiPropertyOptional({
    description: 'Completion policy (Keep vs Auto-delete)',
    enum: CompletionPolicy,
  })
  @IsEnum(CompletionPolicy)
  @IsOptional()
  completionPolicy?: CompletionPolicy;
}
