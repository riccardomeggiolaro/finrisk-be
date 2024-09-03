/* eslint-disable prettier/prettier */
import { IsEmail, IsString, MinLength } from "@nestjs/class-validator";
import { IsAbiCodeUnique } from "src/core/validators/otp-existing.validator";
import { IsUsernameUnique } from "src/core/validators/username-existing.validator";

export class AddUserDTO {
  @IsString()
  company: string;

  @IsString()
  @MinLength(3)
  @IsAbiCodeUnique(
    {
      message: 'Il codice ABI é già esistente'
    }
  )
  abiCode: string;


  @IsUsernameUnique(
    {
      message: 'Lo username é già esistente'
    }
  )
  @IsEmail()
  username: string;
}

export class LoginDTO {
  @IsEmail()
  username: string;

  @IsString()
  password: string;
}