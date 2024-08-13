/* eslint-disable prettier/prettier */
import { FileInterceptor, File } from '@nest-lab/fastify-multer';
import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileCsvPipe } from 'src/core/pipes/file-csv.pipe';
import { DriveAbstractService } from 'src/modules/drive/service/drive.abstract.service';
import { FastifyReply } from 'fastify';

@Controller('drive')
export class DriveController {
    constructor(private readonly driveService: DriveAbstractService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
      @UploadedFile(new FileCsvPipe()) file: File,
      @Res() res: FastifyReply,
    ): Promise<string> {
      res.raw.setHeader('Content-Type', 'text/event-stream');
      res.raw.setHeader('Cache-Control', 'no-cache');
      res.raw.setHeader('Connection', 'keep-alive');
      res.raw.setHeader('Access-Control-Allow-Origin', '*');
  
      const sendEvent = (eventType: string, data: any) => {
        const eventString = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        // console.log('Sending event:', eventString);
        res.raw.write(eventString);
      };
  
      try {
        (await this.driveService.upload(file)).subscribe({
          next: (progress: number) => {
            // console.log(`Sending progress: ${progress}`);
            sendEvent('progress', { progress: Number(progress.toFixed(2)) });
          },
          complete: () => {
            // console.log('Upload completed');
            sendEvent('complete', { message: 'Upload completed successfully' });
          },
          error: (error: Error) => {
            // console.error('Upload error:', error);
            sendEvent('error', { message: error.message });
          }
        });
      } catch (error) {
        // console.error('Error initiating upload:', error);
        sendEvent('error', { message: 'Failed to initiate upload' });
        res.raw.end();
      }
      return "efikefi"
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
