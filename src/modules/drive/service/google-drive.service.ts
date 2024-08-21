/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { FileFoundResponse, GoogleServiceAccount, SearchFilesResponse } from '../entity/google.interface';
import { DriveAbstractService } from './drive.abstract.service';
import { File } from '@nest-lab/fastify-multer';
import { Observable } from 'rxjs';
import { ExternalServiceException } from 'src/core/exceptions/external-service.exception';

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
      try {
        const authClient = new google.auth.JWT(
          this.API_KEYS.client_email,
          null,
          this.API_KEYS.private_key,
          this.SCOPE
        );
        await authClient.authorize();
        const drive = google.drive({ version: 'v3', auth: authClient });
        return drive;
      } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE[0]);
      }
    }

    async create(file: File): Promise<{ progress$: Observable<number>; finalId: Promise<string> }> {
      const fileMetadata = {
        name: file.originalname,
        parents: [this.FOLDER_ID]
      };

      const fileStream = this.createReadStreamFromBuffer(file.buffer);

      const media = {
        mimeType: file.mimetype,
        body: fileStream,
      };

      try {
        const drive = await this.authorize();

        let resolveId: (value: string) => void;
        const finalId = new Promise<string>((resolve) => {
          resolveId = resolve;
        });
  
        const progress$ = new Observable<number>(observer => {
          (async() => {
            const res = await drive.files.create(
              {
                requestBody: fileMetadata,
                media: media,
                fields: 'id',
              },
              {
                onUploadProgress: (progressEvent: { bytesRead: number; }) => {
                  const progress = progressEvent.bytesRead / file.size * 100;
                  observer.next(progress);
                },
              }
            );
            observer.complete();
            resolveId(res.data.id);
          })();
        });
      
        return { progress$, finalId };
      } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE[0]);
      }
    }

    async upload(fileId: string, file: File): Promise<{ progress$: Observable<number>; finalId: Promise<string> }> {
      const fileStream = this.createReadStreamFromBuffer(file.buffer);
    
      try {
        const drive = await this.authorize();

        let resolveId: (value: string) => void;
        const finalId = new Promise<string>((resolve) => {
          resolveId = resolve;
        });
    
        const progress$ = new Observable<number>(observer => {
          (async() => {
            const res = await drive.files.update(
              {
                fileId,
                requestBody: {},
                media: {
                  mimeType: file.mimetype,
                  body: fileStream,
                },
                fields: 'id',
              },
              {
                onUploadProgress: (progressEvent: { bytesRead: number; }) => {
                  const progress = progressEvent.bytesRead / file.size * 100;
                  observer.next(progress);
                },
              }
            );
            observer.complete();
            resolveId(res.data.id);
          })();
        });
        return { progress$, finalId };
      } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE[0]);
      }
    }

    async findByName(fileName: string): Promise<FileFoundResponse> {
      try {
        const drive = await this.authorize();
        const response = await drive.files.list({
            q: `name='${fileName}' and '${this.FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        const exist = response.data.files.length > 0 ? true : false;
        const fileData = exist ? {
          id: response.data.files[0].id,
          name: fileName
        } : null;
        return {
          exist,
          fileData
        };
      } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE[0]);
      }
    }

    async findById(id: string): Promise<FileFoundResponse> {
      try {
        const drive = await this.authorize();
        const response = await drive.files.get({
          fileId: id,
          fields: 'id, name, parents',
          supportsAllDrives: true, // Necessario se utilizzi Drive condivisi
        });
  
        // Verifica se il file si trova nella cartella specificata
        const isInFolder = response.data.parents && response.data.parents.includes(this.FOLDER_ID);
    
        const exist = isInFolder;

        const fileData = exist ? {
          id,
          name: response.data.name
        } : null;
        return {
          exist,
          fileData
        };
      } catch (err) {
        if (err.code === 404) {
          // File non trovato
          return {
            exist: false,
            fileData: null
          };
        }
        throw new ExternalServiceException(err.message, this.SCOPE[0]);
      }
    }

    async list(name: string | null): Promise<SearchFilesResponse> {
      try {
        const drive = await this.authorize();
        const data = {
          q: `'${this.FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name)',
          spaces: 'drive'
        };
        if (name) data.q = `name contains '${name}' and` + data.q;
        const response = await drive.files.list(data);
        const quantity = response.data.files.length;
        return {
          files: response.data.files,
          quantity
        };
      } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE[0]);
      }
    }
}