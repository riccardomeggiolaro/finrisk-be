/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus } from '@nestjs/common';

export class ExternalServiceException extends HttpException {
  constructor(
    public readonly message: string,
    public readonly serviceName: string,
    public readonly originalError?: any
  ) {
    super(
      {
        message,
        serviceName,
        error: 'External Service Error',
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
    this.name = 'ExternalServiceException';
  }
}