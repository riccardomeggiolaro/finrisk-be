/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus } from '@nestjs/common';

export class JustExistException extends HttpException {
  constructor(
    public readonly message: string,
  ) {
    super(
      {
        message,
        error: 'Just exist error',
      },
      HttpStatus.UNPROCESSABLE_ENTITY
    );
    this.name = 'ExternalServiceException';
  }
}