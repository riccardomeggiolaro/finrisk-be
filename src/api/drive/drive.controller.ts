/* eslint-disable prettier/prettier */
import { FileInterceptor, File } from '@nest-lab/fastify-multer';
import { Controller, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileCsvPipe } from 'src/core/pipes/file-csv.pipe';
import { DriveAbstractService } from 'src/modules/drive/service/drive.abstract.service';
import { FastifyReply, FastifyRequest } from 'fastify';

@Controller('drive')
export class DriveController {
    constructor(private readonly driveService: DriveAbstractService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
      @UploadedFile(new FileCsvPipe()) file: File,
      @Req() req: FastifyRequest,
      @Res({ passthrough: true }) res: FastifyReply,
    ): Promise<void> {

      res.raw.setHeader('Content-Type', 'text/event-stream');
      res.raw.setHeader('Cache-Control', 'no-cache');
      res.raw.setHeader('Connection', 'keep-alive');
      res.raw.setHeader('Access-Control-Allow-Origin', '*');
    
      const sendEvent = (eventType: string, data: any) => {
        const eventString = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        res.raw.write(eventString);
      };
    
      const { progress$, finalId } = await this.driveService.upload(file);
  
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
    async findFile(@Param('fileName') fileName: string): Promise<{fileId: string}> {
        const fileId = await this.driveService.findFile(fileName);
        return {
            fileId
        };
    }

    @Get('exist/:fileName')
    async existFile(@Param('fileName') fileName: string): Promise<{exist: boolean}> {
        const exist = await this.driveService.existFile(fileName);
        return {
            exist
        };
    }
}
