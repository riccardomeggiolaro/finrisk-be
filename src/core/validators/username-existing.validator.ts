/* eslint-disable prettier/prettier */
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UserAbstractService } from '@modules/user';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsUsernameUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    private userService: UserAbstractService,
  ) {}

  async validate(username: string, args: ValidationArguments) {
    const existingUsername = await this.userService.findByUsername(username, true);
    return existingUsername ? false : true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Username already exists';
  }
}

export function IsUsernameUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUsernameUniqueConstraint,
    });
  };
}