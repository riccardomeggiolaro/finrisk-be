/* eslint-disable prettier/prettier */
import { FileInterceptor, File } from '@nest-lab/fastify-multer';
import { BadRequestException, Controller, Get, HttpStatus, NotFoundException, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileCsvPipe } from 'src/core/pipes/file-csv.pipe';
import { DriveAbstractService } from '@modules/drive/service/drive.abstract.service';
import { FastifyReply } from 'fastify';
import { ElaboratedFile, ExistFIle, FileFilters } from '@modules/drive/entity/drive.interface';
import { User } from 'src/core/decorators/user.decorator';
import { iUser } from '@api/auth/entity/auth.interface';
import { File as iFile } from '@modules/drive/entity/drive.interface';
import { RunDriveScriptsService } from '@modules/run-drive-scripts/run-drive-scripts.service';

@Controller('drive')
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
      @Res({ passthrough: true }) res: FastifyReply,
    ): Promise<void> {
      // se passato l'id, controllo che l'id del file da modificare esista e abbia lo stesso nome del file nuovo passato
      if (file_id_overwrite) {
        const existUpdatingFile: iFile = await this.driveService.findFileById(file_id_overwrite, false, user.abiCodeId);
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
        // se non passato l'id, controllo che il nome del file passato non sia già presente 
        const fileJustExist: iFile = await this.driveService.findFileByName(file.originalname, false, user.abiCodeId);
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

      // funzione custom per inviare gli eventi
      const sendEvent = (eventType: string, data: any) => {
        const eventString = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        res.raw.write(eventString);
      };

      const { progress$, finalId } = file_id_overwrite ? await this.driveService.uploadFile(file_id_overwrite, file) : await this.driveService.createFile(file, user.abiCodeId);

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
            const fileId = await finalId;
            sendEvent('complete', { fileId });
            resolve();
            res.raw.end();
          }
        });
      });
    }

    @Get('find/name/:fileName')
    async findFile(
      @User() user: iUser,
      @Param('fileName') fileName: string): Promise<iFile> {
        return await this.driveService.findFileByName(fileName, true, user.abiCodeId);
    }

    @Get('exist/name/:fileName')
    async existFile(
      @User() user: iUser,
      @Param('fileName') fileName: string): Promise<ExistFIle> {
        const file = await this.driveService.findFileByName(fileName, false, user.abiCodeId);
        return {
          exist: file ? true : false,
          data: file
        }
    }

    @Get('find/id/:id')
    async findFileById(
      @User() user: iUser,
      @Param('id') id: string): Promise<iFile> {
        return await this.driveService.findFileById(id, true, user.abiCodeId);
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

    // @Get('elaborate-all-files')
    // async elaborateAllFiles(@User() user: iUser): Promise<{ message: string, errors?: string[] }> {
    //   const list = await this.driveService.listFiles(user.abiCodeId)
    //   const folder = await this.driveService.findFolderById(user.abiCodeId);
    //   return await this.runDriveScriptsService.elaborateAllFiles(folder.name);
    // }
}