/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { ConfigService } from '@nestjs/config';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsValidFolderConstraint implements ValidatorConstraintInterface {
  private readonly FOLDER_ID_FINRISK: string;
  private readonly FOLDER_ID_FINBIL: string;

  constructor(private readonly configService: ConfigService) {
    this.FOLDER_ID_FINRISK = this.configService.get<string>('FOLDER_ID_FINRISK');
    this.FOLDER_ID_FINBIL = this.configService.get<string>('FOLDER_ID_FINBIL');
  }

  async validate(folderParent: string, args: ValidationArguments) {
    let id: string | undefined;

    switch (folderParent) {
      case 'finrisk':
        id = this.FOLDER_ID_FINRISK;
        break;
      case 'finbil':
        id = this.FOLDER_ID_FINBIL;
        break;
      default:
        return false; // Cartella non valida
    }

    // Imposta l'ID della cartella nel DTO
    (args.object as any)["folderParent"] = id; // Assicurati che folderParent sia una proprietà del DTO
    return true; // Validazione riuscita
  }

  defaultMessage(args: ValidationArguments) {
    return 'Folder service does not exist';
  }
}

export function IsValidFolder(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidFolderConstraint,
    });
  };
}
