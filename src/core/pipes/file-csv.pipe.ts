/* eslint-disable prettier/prettier */
import { File } from '@nest-lab/fastify-multer';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileCsvPipe implements PipeTransform {
  transform(file: File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException('Only CSV files are allowed');
    }

    return file;
  }
}