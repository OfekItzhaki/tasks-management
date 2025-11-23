import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateStepDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

