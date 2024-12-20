/* eslint-disable prettier/prettier */
import { FileInterceptor, File } from '@nest-lab/fastify-multer';
import { BadRequestException, Controller, Get, HttpStatus, NotFoundException, Param, Post, Query, Req, Res, UploadedFile, UseInterceptors, Delete, UseGuards } from '@nestjs/common';
import { FileCsvPipe } from 'src/core/pipes/file-csv.pipe';
import { DriveAbstractService } from '@modules/drive/service/drive.abstract.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ElaboratedFile, ExistFIle, FileFilters } from '@modules/drive/entity/drive.interface';
import { User } from 'src/core/decorators/user.decorator';
import { iUser } from '@api/auth/entity/auth.interface';
import { File as iFile } from '@modules/drive/entity/drive.interface';
import { RunDriveScriptsService } from '@modules/run-drive-scripts/run-drive-scripts.service';
import { CantAdminGuard } from 'src/core/guards/cant-admin.guard';

@Controller('drive')
@UseGuards(CantAdminGuard)
export class DriveController {
    constructor(
      private readonly driveService: DriveAbstractService,
      private readonly runDriveScriptsService: RunDriveScriptsService
    ) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
      @User() user: iUser,
      @Query('file_id_overwrite') file_id_overwrite: string,
      @UploadedFile(new FileCsvPipe()) file: File,
      @Req() req: FastifyRequest,
      @Res() res: FastifyReply,
    ): Promise<void> {

      // se passato l'id, controllo che l'id del file da modificare esista e abbia lo stesso nome del file nuovo passato
      if (file_id_overwrite) {
        const existUpdatingFile: iFile = await this.driveService.findFileById(file_id_overwrite, user.abiCodeId, false);
        if (!existUpdatingFile) throw new NotFoundException({
          message: 'Not Found',
          file_id_overwrite,
          status: HttpStatus.NOT_FOUND
        });
        if (existUpdatingFile && existUpdatingFile.name !== file.originalname) throw new BadRequestException({
          message: "File name to update is different by new file passed", 
          file_passed: file.originalname,
          file_to_overwrite: existUpdatingFile.name,
          status: HttpStatus.BAD_REQUEST
        });
      } else {
        const abicode = await this.driveService.findFileById(user.abiCodeId, user.abiCodeId, true);

        if (!file.originalname.includes(`_${abicode.name}_`)) throw new BadRequestException({
          message: "File name doesn't include personal abi code associated in this format: '_abicode_'",
          status: HttpStatus.BAD_REQUEST
        });
        
        // se non passato l'id, controllo che il nome del file passato non sia già presente 
        const fileJustExist: iFile = await this.driveService.findFileByName(file.originalname, user.abiCodeId, false);
        if (fileJustExist) throw new BadRequestException({
          message: 'File name just exist in drive',
          existing_file: fileJustExist,
          status: HttpStatus.BAD_REQUEST
        });
      }

      // setto il server sent events
      res.raw.setHeader('Content-Type', 'text/event-stream');
      res.raw.setHeader('Cache-Control', 'no-cache');
      res.raw.setHeader('Connection', 'keep-alive');
      res.raw.setHeader('Access-Control-Allow-Origin', '*');

      // Impostazione degli header SSE
      res.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      let fileId: string | null = null;

      // funzione custom per inviare gli eventi
      const sendEvent = (eventType: string, data: any) => {
        const eventString = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        res.raw.write(eventString);
      };

      const controller = new AbortController();
      const { signal } = controller;      

      const { progress$, finalId } = file_id_overwrite ? await this.driveService.uploadFile(file_id_overwrite, file, signal, false) : await this.driveService.createFile(file, user.abiCodeId, signal);

      res.raw.on('close', async () => {
        if (!fileId) {
          // Per interrompere l'upload
          controller.abort();
        }
      });
    
      await new Promise<void>((resolve, reject) => {
        progress$.subscribe({
          next: (progress: number) => {
            sendEvent('progress', { progress: Number(progress.toFixed(2)) });
          },
          error: (error: Error) => {
            sendEvent('error', { message: error.message });
            reject(error);
            res.raw.end();
          },
          complete: async () => {
            const result = await finalId;
            fileId = result;
            sendEvent('complete', { fileId });
            resolve();
            res.raw.end();
          }
        });
      });
    }

    @Get('download/:id')
    async downloadFile(
      @User() user: iUser,
      @Param('id') id: string,
      @Res() res: FastifyReply
    ): Promise<void> {
      const { buffer, fileName } = await this.driveService.downloadFile(id, user.abiCodeId, true);
    
      // Imposta l'intestazione Content-Disposition per forzare il download con il nome file corretto
      res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.header('Content-Type', 'application/octet-stream');
    
      // Invia il buffer come risposta
      res.send(buffer);
    }

    @Get('exist/name/:fileName')
    async existFile(
      @User() user: iUser,
      @Param('fileName') fileName: string): Promise<ExistFIle> {
        const abicode = await this.driveService.findFileById(user.abiCodeId, user.abiCodeId, true);

        if (!fileName.includes(`_${abicode.name}_`)) throw new BadRequestException({
          message: "File name doesn't include personal abi code associated in this format: '_abicode_'",
          status: HttpStatus.BAD_REQUEST
        });

        const file = await this.driveService.findFileByName(fileName, user.abiCodeId, false);
        return {
          exist: file ? true : false,
          data: file
        }
    }

    @Get('list')
    async list(
      @User() user: iUser,
      @Query() filters: FileFilters): Promise<ElaboratedFile[]> {
        const folderParents = [user.abiCodeId, user.abiCodeElaboratedId]
        if (filters.status === 'no-elaborated') folderParents.splice(1, 1);
        else if (filters.status === 'only-elaborated') folderParents.splice(0, 1);
        const list = await this.driveService.listFiles(folderParents, filters.name);
        return list.map((file: iFile) => {
          return {
            ...file,
            elaborated: file.parents[0] === user.abiCodeElaboratedId ? true : false
          }
        })
    }

    @Delete('id/:id')
    async deleteById(
      @User() user: iUser,
      @Param('id') id: string
    ): Promise<void> {
      await this.driveService.deleteById(id, user.abiCodeId, true);      
    }

    @Get('folder')
    async folderName(
      @User() user: iUser,
    ): Promise<any> {
      return await this.driveService.findFolderById(user.abiCodeId);
    }

    // @Get('elaborate-all-files')
    // async elaborateAllFiles(@User() user: iUser): Promise<{ message: string, errors?: string[] }> {
    //   const list = await this.driveService.listFiles(user.abiCodeId)
    //   const folder = await this.driveService.findFolderById(user.abiCodeId);
    //   return await this.runDriveScriptsService.elaborateAllFiles(folder.name);
    // }
}