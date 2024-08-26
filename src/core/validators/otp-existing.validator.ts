/* eslint-disable prettier/prettier */
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { DriveAbstractService } from '@modules/drive';
import { OtpAbiUserAbstractService } from '@modules/otp-abi-user';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsAbiCodeUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    private driveService: DriveAbstractService,
    private otpAbiUserService: OtpAbiUserAbstractService
  ) {}

  async validate(abiCode: string, args: ValidationArguments) {
    const existingAbiCodeOnDrive = await this.driveService.findFolderByName(abiCode);
    const existingAbiCodeOnUser = await this.otpAbiUserService.findByAbiCode(abiCode);
    return existingAbiCodeOnDrive || existingAbiCodeOnUser ? false : true;
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