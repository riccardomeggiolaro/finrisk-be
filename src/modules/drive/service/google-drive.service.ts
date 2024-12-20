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
import { GaxiosError } from 'gaxios';

@Injectable()
export class GoogleDriveService extends DriveAbstractService {
  private readonly SCOPE_GOOGLE_DRIVE: string = 'https://www.googleapis.com/auth/drive';
  private readonly API_KEYS: GoogleServiceAccount;

  constructor(private readonly configService: ConfigService) {
      super();
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

  async createFile(file: File, folderParent: string, abortSignal: AbortSignal): Promise<ProgressUploadFile> {
    const fileMetadata = {
      name: file.originalname,
      parents: [folderParent]
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
          try {
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
                signal: abortSignal
              }
            );
            observer.complete();
            resolveId(res.data.id);
          } catch (error) {
            // Gestisci GaxiosError specificamente
            if (error instanceof GaxiosError && error.message === 'The user aborted a request.') {
              observer.complete(); // Completa l'osservatore
              return; // Esci dal catch
            }
          }
        })();
      });
    
      return { progress$, finalId };
    } catch (err) {
      throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
    }
  }

  async uploadFile(id: string, file: File, abortSignal: AbortSignal, throwErrorOnNotFound: boolean): Promise<ProgressUploadFile> {
    const fileStream = this.createReadStreamFromBuffer(file.buffer);

    try {
        const drive = await this.authorize();

        let resolveId: (value: string) => void;
        const finalId = new Promise<string>((resolve) => {
            resolveId = resolve;
        });

        const progress$ = new Observable<number>(observer => {
            (async () => {
                try {
                    const res = await drive.files.update(
                        {
                            fileId: id,
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
                            // Passa il segnale di aborto se fornito
                            signal: abortSignal,
                        }
                    );
                    observer.complete();
                    resolveId(res.data.id);
                  } catch (error) {
                    // Gestisci GaxiosError specificamente
                    if (error instanceof GaxiosError && error.message === 'The user aborted a request.') {
                      observer.complete(); // Completa l'osservatore
                      return; // Esci dal catch
                    }
                  }
            })();
        });

        return { progress$, finalId };
    } catch (err) {
      if (err.status === 404 && throwErrorOnNotFound) {
        throw new NotFoundException(`File con ID ${id} non trovato`);
      }
      throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
    }
  }  

  async downloadFile(id: string, folderParent: string, throwErrorOnNotFound: boolean): Promise<{ buffer: Buffer, fileName: string }> {
    try {
      const drive = await this.authorize();
  
      // Ottieni il nome del file
      const metadata = await drive.files.get({
        fileId: id,
        fields: 'name'
      });
      const fileName = metadata.data.name;
      if (!fileName) throw new Error('Nome file non trovato nei metadati.');
  
      // Ottieni il contenuto del file
      const response = await drive.files.get(
        { fileId: id, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
  
      const buffer = Buffer.from(response.data as ArrayBuffer);
      return { buffer, fileName };
    } catch (err) {
      if (err.status === 404 && throwErrorOnNotFound) {
        throw new NotFoundException(`File con ID ${id} non trovato`);
      }
      throw new ExternalServiceException(`Errore nel download del file: ${err.message}`, this.SCOPE_GOOGLE_DRIVE[0]);
    }
  }    

  async listFiles(folderParents: string[], name?: string): Promise<iFile[]> {
    try {
        const drive = await this.authorize();

        // Costruisci la query per cercare in tutte le cartelle specificate
        const folderQuery = folderParents.map(folderId => `'${folderId}' in parents`).join(' or ');

        // Crea la query di base
        let query = `(${folderQuery}) and mimeType != 'application/vnd.google-apps.folder' and trashed=false`;

        // Aggiungi la condizione sul nome se fornito
        if (name) {
            query = `name contains '${name}' and ` + query;
        }

        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name, parents, createdTime)',
            spaces: 'drive',
            orderBy: 'createdTime desc',
        });

        return response.data.files || []; // Ritorna un array vuoto se non ci sono file
    } catch (err) {
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
    }
  }  

  async findFileByName(name: string, folderParent: string, throwErrorOnNotFound: boolean): Promise<iFile> {
    try {
      const drive = await this.authorize();
      const response = await drive.files.list({
          q: `name='${name}' and '${folderParent}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`,
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
        name: name,
        parents,
        createdTime
      }
    } catch (err) {
      if (err.status === 404) throw new NotFoundException();
      throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
    }
  }

  async findFileById(id: string, folderParent: string, throwErrorOnNotFound: boolean): Promise<iFile> {
    try {
      const drive = await this.authorize();
      const response = await drive.files.get({
        fileId: id,
        fields: 'id, name, parents, createdTime',
        supportsAllDrives: true, // Necessario se utilizzi Drive condivisi
      });
      // Verifica se il file si trova nella cartella specificata
      const isInFolder = response.data.parents && response.data.parents.includes(folderParent);
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
    
  async createFolder(name: string, parentFolder: string): Promise<{ id: string, name: string }> {
    const drive = await this.authorize();
    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolder]
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
  
  async findFolderByName(name: string, folderParent: string): Promise<Folder> {
    try {
      const drive = await this.authorize();
      const response = await drive.files.list({
          q: `name='${name}' and '${folderParent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`,
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
        fields: 'id, name, parents',
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

  async deleteById(fileId: string, folderParent: string, throwErrorOnNotFound: boolean): Promise<void> {
    try {
        const drive = await this.authorize();

        // Prova a eliminare il file con l'ID specificato
        await drive.files.delete({ fileId });
    } catch (err) {
        if (err.status === 404 && throwErrorOnNotFound) throw new NotFoundException(`File o cartella con ID '${fileId}' non trovato.`);
        throw new ExternalServiceException(err.message, this.SCOPE_GOOGLE_DRIVE[0]);
    }
  }
}