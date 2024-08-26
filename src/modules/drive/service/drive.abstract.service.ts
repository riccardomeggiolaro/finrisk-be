/* eslint-disable prettier/prettier */
import { File } from '@nest-lab/fastify-multer';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Readable } from 'stream';
import { Folder, SearchFilesResponse } from '../entity/drive.interface';
import { File as iFile } from '../entity/drive.interface';

@Injectable()
export abstract class DriveAbstractService {
    abstract createFile(file: File, folderParent?: string): Promise<{ progress$: Observable<number>; finalId: Promise<string> }>;
    abstract uploadFile(id: string, file: File): Promise<{ progress$: Observable<number>; finalId: Promise<string> }>;
    abstract findFileByName(fileName: string, throwErrorOnNotFound: boolean, folderParent?: string): Promise<iFile>;
    abstract findFileById(id: string, throwErrorOnNotFound: boolean, folderParent?: string): Promise<iFile>;
    abstract listFiles(name: string | null, folderParent?: string): Promise<SearchFilesResponse>;
    abstract createFolder(name: string): Promise<{ id: string }>;
    abstract findFolderByName(name: string): Promise<Folder>;

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