import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderStepsDto {
  @ApiProperty({
    description: 'Array of step IDs in the desired order',
    example: ['550e8400-e29b-41d4-a716-446655440000', '67108400-e29b-41d4-a716-446655440001'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  stepIds: string[];
}
