import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateToDoListDto {
  @ApiPropertyOptional({
    description: 'Name of the to-do list',
    example: 'Updated List Name',
  })
  @IsString()
  @IsOptional()
  name?: string;
}
