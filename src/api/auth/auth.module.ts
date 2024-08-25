/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { EmailModule } from '@modules/email';
import { UserModule } from '@modules/user';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { OtpUserModule } from '@modules/otp-user';
import { IsAbiCodeUniqueConstraint } from 'src/core/validators/otp-existing.validator';

@Module({
  imports: [
    UserModule,
    EmailModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: "7d" }
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({session: true}),
    OtpUserModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    IsAbiCodeUniqueConstraint
  ],
})
export class AuthApiModule {}