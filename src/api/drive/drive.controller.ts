/* eslint-disable prettier/prettier */
import { FileInterceptor, File } from '@nest-lab/fastify-multer';
import { BadRequestException, Controller, Get, HttpStatus, NotFoundException, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileCsvPipe } from 'src/core/pipes/file-csv.pipe';
import { DriveAbstractService } from 'src/modules/drive/service/drive.abstract.service';
import { FastifyReply } from 'fastify';
import { FileFoundResponse, SearchFilesResponse } from 'src/modules/drive/interface/google.interface';

@Controller('drive')
export class DriveController {
    constructor(private readonly driveService: DriveAbstractService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
      @Query('file_id_overwrite') file_id_overwrite: string,
      @UploadedFile(new FileCsvPipe()) file: File,
      @Res({ passthrough: true }) res: FastifyReply,
    ): Promise<void> {

      // se passato l'id, controllo che l'id del file da modificare esista e abbia lo stesso nome del file nuovo passato
      if (file_id_overwrite) {
        const existUpdatingFile: FileFoundResponse = await this.driveService.findById(file_id_overwrite);
        if (!existUpdatingFile.exist) throw new NotFoundException({
          message: 'Not Found',
          file_id_overwrite,
          status: HttpStatus.NOT_FOUND
        });
        if (existUpdatingFile.exist && existUpdatingFile.fileData.name !== file.originalname) throw new BadRequestException({
          message: "File name to update is different by new file passed", 
          file_passed: file.originalname,
          file_to_overwrite: existUpdatingFile.fileData.name,
          status: HttpStatus.BAD_REQUEST
        });
      } else {
        // se non passato l'id, controllo che il nome del file passato non sia già presente 
        const fileJustExist: FileFoundResponse = await this.driveService.findByName(file.originalname);
        if (fileJustExist.exist) throw new BadRequestException({
          message: 'File name just exist in drive',
          existing_file: fileJustExist.fileData,
          status: HttpStatus.BAD_REQUEST
        });
      }

      // setto il server sent events
      res.raw.setHeader('Content-Type', 'text/event-stream');
      res.raw.setHeader('Cache-Control', 'no-cache');
      res.raw.setHeader('Connection', 'keep-alive');
      res.raw.setHeader('Access-Control-Allow-Origin', '*');

      // funzione custom per inviare gli eventi
      const sendEvent = (eventType: string, data: any) => {
        const eventString = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        res.raw.write(eventString);
      };

      const { progress$, finalId } = file_id_overwrite ? await this.driveService.upload(file_id_overwrite, file) : await this.driveService.create(file);

      await new Promise<void>((resolve, reject) => {
        progress$.subscribe({
          next: (progress: number) => {
            sendEvent('progress', { progress: Number(progress.toFixed(2)) });
          },
          error: (error: Error) => {
            console.error('Upload error:', error);
            sendEvent('error', { message: error.message });
            reject(error);
            res.raw.end();
          },
          complete: async () => {
            const fileId = await finalId;
            sendEvent('complete', { fileId });
            resolve();
            res.raw.end();
          }
        });
      });
    }

    @Get('find/:fileName')
    async findFile(@Param('fileName') fileName: string): Promise<FileFoundResponse> {
        const response = await this.driveService.findByName(fileName);
        if (!response.exist) throw new NotFoundException();
        return response;
    }

    @Get('exist/:fileName')
    async existFile(@Param('fileName') fileName: string): Promise<FileFoundResponse> {
        return await this.driveService.findByName(fileName);
    }

    @Get('find/id/:id')
    async findFileById(@Param('id') id: string): Promise<FileFoundResponse> {
      const response = await this.driveService.findById(id);
      if (!response.exist) throw new NotFoundException();
      return response;
    }

    @Get('list')
    async list(@Query('name') name: string): Promise<SearchFilesResponse> {
      return await this.driveService.list(name);
    }
}
