/* eslint-disable prettier/prettier */
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
    const existingAbiCode = await this.driveService.findFolderByName(abiCode);
    return existingAbiCode ? false : true;
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