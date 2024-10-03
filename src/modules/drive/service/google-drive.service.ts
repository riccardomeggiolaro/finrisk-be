/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Folder, GoogleServiceAccount, ProgressUploadFile } from '../entity/drive.interface';
import { DriveAbstractService } from './drive.abstract.service';
import { File } from '@nest-lab/fastify-multer';
import { Observable } from 'rxjs';
import { ExternalServiceException } from 'src/core/exceptions/external-service.exception';
import { File as iFile } from '../entity/drive.interface';

@Injectable()
export class GoogleDriveService extends DriveAbstractService {
  private readonly SCOPE_GOOGLE_DRIVE: string = 'https://www.googleapis.com/auth/drive';
  private readonly FOLDER_ID: string;
    private readonly API_KEYS: GoogleServiceAccount;

    constructor(private readonly configService: ConfigService) {
        super();
        this.FOLDER_ID = this.configService.get<string>('FOLDER_ID');
        this.API_KEYS = JSON.parse(this.configService.get<string>('API_KEYS'));
    }

    private async authorize(): Promise<any> { 
      try {
        const authClient = new google.auth.JWT(
          this.API_KEYS.client_email,
          null,
          this.API_KEYS.private_key,
          this.SCOPE_GOOGLE_DRIVE
        );
        await authClient.authorize();
        const drive = google.drive({ version: 'v3', auth: authClient });
        return drive;
      } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
      }
    }

    async createFile(file: File, folderParent?: string): Promise<ProgressUploadFile> {
      const fileMetadata = {
        name: file.originalname,
        parents: [folderParent || this.FOLDER_ID]
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
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
      }
    }

    async uploadFile(fileId: string, file: File): Promise<ProgressUploadFile> {
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
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
      }
    }

    async findFileByName(fileName: string, throwErrorOnNotFound: boolean, folderParent?: string): Promise<iFile> {
      try {
        const drive = await this.authorize();
        const response = await drive.files.list({
            q: `name='${fileName}' and '${folderParent || this.FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name, parents, createdTime)',
            spaces: 'drive'
        });
        const id = response.data.files.length > 0 ? response.data.files[0].id : null;
        const parents = response.data.files.length > 0 ? response.data.files[0].parents : null;
        const createdTime = response.data.files.length > 0 ? response.data.files[0].createdTime : null;
        if (!id && throwErrorOnNotFound) throw new NotFoundException();
        if (!id && !throwErrorOnNotFound) return null;
        return {
          id,
          name: fileName,
          parents,
          createdTime
        }
      } catch (err) {
        if (err.status === 404) throw new NotFoundException();
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
      }
    }

    async findFileById(id: string, throwErrorOnNotFound: boolean, folderParent?: string): Promise<iFile> {
      try {
        const drive = await this.authorize();
        const response = await drive.files.get({
          fileId: id,
          fields: 'id, name, parents, createdTime',
          supportsAllDrives: true, // Necessario se utilizzi Drive condivisi
        });
        // Verifica se il file si trova nella cartella specificata
        const isInFolder = response.data.parents && response.data.parents.includes(folderParent || this.FOLDER_ID);
        if (!isInFolder && throwErrorOnNotFound) throw new NotFoundException();
        if (!isInFolder && !throwErrorOnNotFound) return null;
        return {
          id,
          name: response.data.name,
          parents: response.data.parents,
          createdTime: response.data.createdTime
        }
      } catch (err) {
        if (err.status === 404 && throwErrorOnNotFound) throw new NotFoundException();
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
      }
    }

    async listFiles(folderParents: string[], name?: string): Promise<iFile[]> {
      try {
        const drive = await this.authorize();
    
        // Costruisci la query per cercare in tutte le cartelle specificate
        const folderQuery = folderParents.map(folderId => `'${folderId}' in parents`).join(' or ');
    
        const data = {
          q: `(${folderQuery}) and mimeType != 'application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name, parents, createdTime)',
          spaces: 'drive',
          orderBy: 'createdTime desc'
        };

        if (name) data.q = `name contains '${name}' and` + data.q;
        
        const response = await drive.files.list(data);
        return response.data.files;
      } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
      }
    }
    
    async createFolder(name: string, parentFolder?: string): Promise<{ id: string, name: string }> {
      const drive = await this.authorize();
      const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolder || this.FOLDER_ID]
      };
      try {
        const file = await drive.files.create({
          resource: fileMetadata,
          fields: 'id'
        });
        return {
          id: file.data.id,
          name
        };
      } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
      }
    }
    
    async findFolderByName(name: string): Promise<Folder> {
      try {
        const drive = await this.authorize();
        const response = await drive.files.list({
            q: `name='${name}' and '${this.FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        const exist = response.data.files.length > 0 ? true : false;
        const fileData = exist ? {
          id: response.data.files[0].id,
          name,
        } : null;
        return fileData;
      } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
      }
    }

    async findFolderById(id: string): Promise<Folder> {
      try {
        const drive = await this.authorize();
        const response = await drive.files.get({
          fileId: id,
          fields: 'id, name',
          supportsAllDrives: true, // Necessario se utilizzi Drive condivisi
        });
        return {
          id,
          name: response.data.name,
        }
      } catch (err) {
        if (err.status === 404) throw new NotFoundException();
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
      } 
    }
}