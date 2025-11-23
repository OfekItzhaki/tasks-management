import { IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  profilePicture?: string;

  @IsString()
  @MinLength(8)
  password: string;
}