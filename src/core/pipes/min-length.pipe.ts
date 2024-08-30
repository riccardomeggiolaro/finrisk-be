/* eslint-disable prettier/prettier */
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class MinLengthPipe implements PipeTransform {
  constructor(private readonly minLength: number) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value !== 'string') {
      throw new BadRequestException('Il valore deve essere una stringa');
    }

    if (value.length < this.minLength) {
      throw new BadRequestException(`La lunghezza minima richiesta è ${this.minLength}`);
    }

    return value;
  }
}