/* eslint-disable prettier/prettier */
import { File } from '@nest-lab/fastify-multer';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Readable } from 'stream';
import { FileFoundResponse, SearchFilesResponse } from '../interface/google.interface';

@Injectable()
export abstract class DriveAbstractService {
    abstract create(file: File): Promise<{ progress$: Observable<number>; finalId: Promise<string> }>;
    abstract upload(id: string, file: File): Promise<{ progress$: Observable<number>; finalId: Promise<string> }>;
    abstract findByName(fileName: string): Promise<FileFoundResponse>;
    abstract findById(id: string): Promise<FileFoundResponse>;
    abstract list(name: string | null): Promise<SearchFilesResponse>;

    protected createReadStreamFromBuffer(buffer: Buffer, chunkSize: number = 2 * 1024 * 1024): Readable {
        let currentPosition = 0;
      
        const readableStream = new Readable({
          read() {
            // Se la posizione corrente è oltre la lunghezza del buffer, termina lo stream
            if (currentPosition >= buffer.length) {
              this.push(null);
            } else {
              // Calcola il prossimo chunk da inviare
              const end = Math.min(currentPosition + chunkSize, buffer.length);
              const chunk = buffer.slice(currentPosition, end);
              this.push(chunk);
              currentPosition = end;
            }
          }
        });
      
        return readableStream;
      }
}