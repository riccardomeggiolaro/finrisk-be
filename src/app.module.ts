/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DriveApiModule } from './api/drive/drive.module';
import { DriveModule } from './modules/drive/drive.module';
import { DriveAbstractService } from './modules/drive/service/drive.abstract.service';
import { GoogleDriveService } from './modules/drive/service/google-drive.service';
import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { AuthModule } from '@api/auth/auth.module';
import { UserAbstractService, UserModule, UserService } from '@modules/user';
import { UserIdentityAbstractService, UserIdentityModule, UserIdentityService } from '@modules/user-identity';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DriveModule.forRoot([
      { provide: DriveAbstractService, useClass: GoogleDriveService }
    ]),
    UserModule.forRoot([
      {provide: UserAbstractService, useClass: UserService}
    ]),
    UserIdentityModule.forRoot([
      {provide: UserIdentityAbstractService, useClass: UserIdentityService}
    ]),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/finrisk'),
    UserIdentityModule,
    DriveApiModule,
    FastifyMulterModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}