/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { GoogleServiceAccount } from '../interface/google.interface';
import { DriveAbstractService } from './drive.abstract.service';
import { Readable } from 'stream';
import { Observable, Observer } from 'rxjs';
import { File } from '@nest-lab/fastify-multer';

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
    
    private calculateChunkSize(fileSize: number): number {
      const MIN_CHUNK_SIZE = 256 * 1024; // 256 KB
      const MAX_CHUNK_SIZE = 100 * 1024 * 1024; // 100 MB
      const BASE_SIZE = 10 * 1024 * 1024; // 10 MB
  
      if (fileSize <= BASE_SIZE) {
          return fileSize;
      }
  
      const chunkSize = Math.floor(BASE_SIZE / Math.log(fileSize));
      return Math.min(Math.max(chunkSize, MIN_CHUNK_SIZE), MAX_CHUNK_SIZE);
    }

    async upload(file: File): Promise<Observable<number>> {
        return new Observable<number>((observer: Observer<number>) => {
          this.authorize().then(drive => {
            const fileSize = file.size;
            const chunkSize = this.calculateChunkSize(fileSize);
            let start = 0;
            let uploadedBytes = 0;
    
            drive.files.create({
              requestBody: {
                name: file.originalname,
                parents: [this.FOLDER_ID],
              },
              media: {
                mimeType: file.mimetype,
              },
              fields: 'id',
            }).then(res => {
              const fileId = res.data.id;
    
              const uploadChunk = () => {
                if (start < fileSize) {
                  const end = Math.min(start + chunkSize, fileSize);
                  const chunk = file.buffer.slice(start, end);
                  const chunkStream = new Readable();
                  chunkStream.push(chunk);
                  chunkStream.push(null);
    
                  drive.files.update({
                    fileId: fileId,
                    media: {
                      body: chunkStream,
                    },
                    addParents: this.FOLDER_ID,
                  }, {
                    headers: {
                      'Content-Range': `bytes ${start}-${end - 1}/${fileSize}`,
                    },
                  }).then(() => {
                    uploadedBytes += (end - start);
                    const progress = (uploadedBytes / fileSize) * 100;
                    observer.next(progress);
    
                    start = end;
                    uploadChunk();
                  }).catch(error => {
                    observer.error(error);
                  });
                } else {
                  observer.complete();
                }
              };
    
              uploadChunk();
            }).catch(error => {
              observer.error(error);
            });
          }).catch(error => {
            observer.error(error);
          });
        });
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