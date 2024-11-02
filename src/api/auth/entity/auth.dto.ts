/* eslint-disable prettier/prettier */
import { IsEmail, IsString, MinLength } from "@nestjs/class-validator";
import { IsValidFolder } from "src/core/validators/is-valid-folder.validator";
import { IsAbiCodeUnique } from "src/core/validators/is-abicode-unique.validator";
import { IsUsernameUnique } from "src/core/validators/username-existing.validator";

export class AddUserDTO {
  @IsString()
  company: string;

  @IsString()
  @IsValidFolder(
    {
      message: 'La cartella selezionata non esiste'
    }
  )
  folderParent: string;

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

  @IsString()
  folderParent: string;
}

export class RecoveryPasswordDTO {
  @IsString()
  @IsValidFolder()
  folderParent: string;
}