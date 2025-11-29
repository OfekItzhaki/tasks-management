import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
