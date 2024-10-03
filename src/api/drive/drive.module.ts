/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { DriveModule } from '@modules/drive';
import { RunDriveScriptsModule } from '@modules/run-drive-scripts/run-drive-scripts.module';

@Module({
  imports: [
    DriveModule,
    FastifyMulterModule,
    RunDriveScriptsModule
  ],
  controllers: [DriveController],
  providers: [],
})
export class DriveApiModule {}