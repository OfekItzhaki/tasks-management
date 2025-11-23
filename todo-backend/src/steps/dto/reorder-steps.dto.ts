import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class ReorderStepsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  stepIds: number[];
}

