import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateToDoListDto {
  @ApiProperty({
    description: 'Name of the to-do list',
    example: 'My Daily Tasks',
  })
  @IsString()
  name: string;
}
