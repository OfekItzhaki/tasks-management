import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateStepDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
