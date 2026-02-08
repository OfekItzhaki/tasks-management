import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskBehavior, CompletionPolicy } from '@prisma/client';

export class CreateToDoListDto {
  @ApiProperty({
    description: 'Name of the to-do list',
    example: 'My Daily Tasks',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Task behavior (Recurring vs One-off)',
    enum: TaskBehavior,
    default: TaskBehavior.ONE_OFF,
  })
  @IsEnum(TaskBehavior)
  @IsOptional()
  taskBehavior?: TaskBehavior;

  @ApiProperty({
    description: 'Completion policy (Keep vs Auto-delete)',
    enum: CompletionPolicy,
    default: CompletionPolicy.KEEP,
  })
  @IsEnum(CompletionPolicy)
  @IsOptional()
  completionPolicy?: CompletionPolicy;
}
