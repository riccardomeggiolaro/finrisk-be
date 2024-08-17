/* eslint-disable prettier/prettier */
import { File } from '@nest-lab/fastify-multer';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export abstract class DriveAbstractService {
    abstract upload(file: File): Promise<{ progress$: Observable<number>; finalId: Promise<string> }>;
    abstract findFile(fileName: string): Promise<string>;
    abstract existFile(fileName: string): Promise<boolean>;
}