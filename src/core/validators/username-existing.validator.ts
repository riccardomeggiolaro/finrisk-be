/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
    // Access the finService from the DTO
    const folderParent = (args.object as any).folderParent;

    console.log(folderParent);

    const existingUsername = await this.userService.findByUsername(username, folderParent);
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