/* eslint-disable prettier/prettier */
import { Controller, Get, Patch, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service'; 
import { FileInterceptor, File } from '@nest-lab/fastify-multer';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Patch("/file")
  @UseInterceptors(FileInterceptor("file"))
  singleFile(@UploadedFile() file: File) {
    return console.log(file);
  }
}
