/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { RunDriveScriptsService } from './run-drive-scripts.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        HttpModule,
        ConfigModule
    ],
    providers: [
        RunDriveScriptsService
    ],
    exports: [
        RunDriveScriptsService
    ]
})
export class RunDriveScriptsModule {
}