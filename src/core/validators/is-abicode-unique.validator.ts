/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { DriveAbstractService } from '@modules/drive';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsAbiCodeUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    private driveService: DriveAbstractService
  ) {}

  async validate(abiCode: string, args: ValidationArguments) {
    // Access the finService from the DTO
    const folderParent = (args.object as any).folderParent;

    // Use finService in your findFolderByName call
    const existingAbiCodeOnDrive = await this.driveService.findFolderByName(abiCode, folderParent);
   
    return !existingAbiCodeOnDrive; // Return true if neither exists
  }

  defaultMessage(args: ValidationArguments) {
    return 'OTP already exists';
  }
}

export function IsAbiCodeUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAbiCodeUniqueConstraint,
    });
  };
}
