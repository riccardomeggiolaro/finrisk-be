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
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { DriveApiModule } from '@api/drive/drive.module';
import { AuthApiModule } from '@api/auth/auth.module';
import { EmailAbstractService, EmailModule, GoogleEmailService } from '@modules/email';
import { OtpAbiUserAbstractService, OtpAbiUserModule, OtpAbiUserService } from '@modules/otp-abi-user';
import { RunDriveScriptsModule } from '@modules/run-drive-scripts/run-drive-scripts.module';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    DriveModule.forRoot([
      { provide: DriveAbstractService, useClass: GoogleDriveService }
    ]),
    EmailModule.forRoot([
      { provide: EmailAbstractService, useClass: GoogleEmailService }
    ]),
    UserModule.forRoot([
      {provide: UserAbstractService, useClass: UserService}
    ]),
    OtpAbiUserModule.forRoot([
      { provide: OtpAbiUserAbstractService, useClass: OtpAbiUserService }
    ]),
    RunDriveScriptsModule,
    FastifyMulterModule,
    AuthApiModule,
    DriveApiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}