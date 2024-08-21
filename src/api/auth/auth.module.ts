/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    AuthModule
  ],
  controllers: [AuthController],
  providers: [],
})
export class AuthApiModule {}