/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { DriveModule } from '@modules/drive';

@Module({
  imports: [
    DriveModule,
    FastifyMulterModule
  ],
  controllers: [DriveController],
  providers: [],
})
export class DriveApiModule {}