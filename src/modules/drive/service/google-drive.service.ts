/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { GoogleServiceAccount } from '../interface/google.interface';
import { DriveAbstractService } from './drive.abstract.service';
import { File } from '@nest-lab/fastify-multer';
import { Readable } from 'stream';
import { Observable } from 'rxjs';

const CHUNK_SIZE = 2 * 1024 * 1024; // 5 MB

@Injectable()
export class GoogleDriveService extends DriveAbstractService {
    private readonly FOLDER_ID: string;
    private readonly SCOPE: string[];
    private readonly API_KEYS: GoogleServiceAccount;

    constructor(private readonly configService: ConfigService) {
        super();
        this.FOLDER_ID = this.configService.get<string>('FOLDER_ID');
        this.SCOPE = [this.configService.get<string>('SCOPE')];
        this.API_KEYS = JSON.parse(this.configService.get<string>('API_KEYS'))
    }

    private async authorize(): Promise<any> {
        const authClient = new google.auth.JWT(
            this.API_KEYS.client_email,
            null,
            this.API_KEYS.private_key,
            this.SCOPE
        );
        await authClient.authorize();
        const drive = google.drive({ version: 'v3', auth: authClient });
        return drive;
    }

    private async find(drive: any, fileName: string): Promise<string | null> {
        try {
            const response = await drive.files.list({
                q: `name='${fileName}' and '${this.FOLDER_ID}' in parents and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.data.files.length > 0) {
                return response.data.files[0].id;
            } else {
                return null;
            }
        } catch (error) {
            throw new BadRequestException(`Failed to search for file in Google Drive: ${error.message}`);
        }
    }
    
    private createReadStreamFromBuffer(buffer: Buffer, chunkSize: number = CHUNK_SIZE): Readable {
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

    async upload(file: File): Promise<Observable<number>> {
      const fileMetadata = {
        name: file.originalname,
        parents: [this.FOLDER_ID]
      };

      const fileStream = this.createReadStreamFromBuffer(file.buffer);

      const media = {
        mimeType: 'text/csv',
        body: fileStream,
      };

      const create = async (
        drive: { files: { create: (arg0: { requestBody: { name: string; parents: string[]; }; media: { mimeType: string; body: Readable; }; fields: string; }, arg1: { onUploadProgress: (progressEvent: any) => void; }) => any; }; }, 
        onUploadProgress: { onUploadProgress: (progressEvent: any) => void; }
      ) => {
        const res = await drive.files.create(
          {
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
          },
          onUploadProgress
        );
        return res;
      }

      return new Observable<number>(observer => {
        (async () => {
          try {
            const drive = await this.authorize();
            const res = await create(
              drive,
              {
                onUploadProgress: (progressEvent: { bytesRead: number; }) => {
                  const progress = progressEvent.bytesRead / file.size * 100;
                  observer.next(progress);
                },
              }
            )
            return res.data.id;
          } catch (err) {
            console.log
            observer.error(err);
          } finally {
            observer.complete();
          }
        })();
      })
    }

    async findFile(fileName: string): Promise<string> {
        const drive = await this.authorize();
        const file = await this.find(drive, fileName);
        if (!file) throw new NotFoundException();
        return file;
    }

    async existFile(fileName: string): Promise<boolean> {
        const drive = await this.authorize();
        const file = await this.find(drive, fileName);
        return file ? true : false;
    }
}