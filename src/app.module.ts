/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DriveModule } from './modules/drive/drive.module';
import { DriveAbstractService } from './modules/drive/service/drive.abstract.service';
import { GoogleDriveService } from './modules/drive/service/google-drive.service';
import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { UserAbstractService, UserModule, UserService } from '@modules/user';
import { UserIdentityAbstractService, UserIdentityModule, UserIdentityService } from '@modules/user-identity';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { DriveApiModule } from '@api/drive/drive.module';
import { AuthModule } from '@modules/auth';
import { AuthApiModule } from '@api/auth/auth.module';

@Module({
  imports: [
    PassportModule.register({ session: true }),
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
    UserModule,
    UserIdentityModule,
    AuthModule,
    FastifyMulterModule,
    AuthApiModule,
    DriveApiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}