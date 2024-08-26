/* eslint-disable prettier/prettier */
import { IsEmail, IsString, Matches, MinLength } from "@nestjs/class-validator";
import { IsAbiCodeUnique } from "src/core/validators/otp-existing.validator";

export class AddUserDTO {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  company: string;

  @IsString()
  @MinLength(3)
  @IsAbiCodeUnique(
    {
      message: 'ABI already exists'
    }
  )
  abiCode: string;

  @IsEmail()
  username: string;

  @MinLength(8)
  @Matches(
    new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"),
    {
      message: 'Password must be at least eight characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  )
  password: string;
}

export class LoginDTO {
  @IsEmail()
  username: string;

  @IsString()
  password: string;
}