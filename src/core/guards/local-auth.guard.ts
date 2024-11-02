/* eslint-disable prettier/prettier */
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { validate } from 'class-validator';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { IsValidFolderConstraint } from '../validators/is-valid-folder.validator'; // Importa il tuo validatore
import { LoginDTO } from '@api/auth/entity/auth.dto';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') implements CanActivate {
  constructor(private readonly isValidFolderConstraint: IsValidFolderConstraint) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);

    // Log del body prima della validazione
    // console.log('Request Body Before Validation:', request.body);

    // Validazione del DTO
    const loginDto = plainToInstance(LoginDTO, request.body);
    const errors = await validate(loginDto);
    if (errors.length > 0) {
      console.error('Validation Errors:', errors);
      throw new UnauthorizedException('Validation failed');
    }

    // Usa il validatore per impostare folderParent
    const isValid = await this.isValidFolderConstraint.validate(loginDto.folderParent, {
      object: request.body,
      property: 'folderParent',
      constraints: [],
      targetName: '',
      value: loginDto.folderParent,
    });

    // Log dopo la validazione
    // console.log('Validation Result:', isValid);
    // console.log('Request Body After Validation:', request.body);

    if (!isValid) {
      throw new UnauthorizedException('Invalid folder parent');
    }

    // Se la validazione ha successo, chiama super.canActivate
    return super.canActivate(context) as boolean;
  }

  getRequest(context: ExecutionContext): Request {
    return super.getRequest(context);
  }
}