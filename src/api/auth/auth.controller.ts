/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { Public } from 'src/core/decorators/is.public.decorator';
import { User } from 'src/core/decorators/user.decorator';
import { LocalAuthGuard } from 'src/core/guards/local-auth.guard';
import { AddUserDTO } from '@api/auth/entity/auth.dto';
import { AuthService } from './auth.service';
import { AuthenticatedUser, iUser } from './entity/auth.interface';

@Controller('auth')
export class AuthController {

    constructor(
      private authService: AuthService
    ) {}

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@User() user: iUser): Promise<{ message: string, publicKey: string }> {
      const confirmationOtp = await this.authService.sendConfirmationLogin(user);
      // Risponde immediatamente al client con il token
      return { message: 'Confirmation email sent', publicKey: confirmationOtp.publicKey };
    }
    
    @Public()
    @Get('confirm-login/:publicKey/:otpCode')
    async confirmLogin(@Param('publicKey') publicKey: string, @Param('otpCode', ParseIntPipe) otpCode: number): Promise<AuthenticatedUser> {
      const otpValidated = await this.authService.validateOtpCode(publicKey, otpCode);
      return await this.authService.login(otpValidated.user);
    }

    @Get('profile')
    async me(@User() user: iUser): Promise<iUser> {
      return user;
    }

    @Public()
    @Post('register')
    async register(@Body() addUserDTO: AddUserDTO): Promise<{ message: string, publicKey: string }> {
      const user = await this.authService.register(addUserDTO);
      const confirmationOtp = await this.authService.sendConfirmationRegister(user, addUserDTO.abiCode);
      return { message: 'Confirmation email sent', publicKey: confirmationOtp.publicKey };
    }

    @Public()
    @Get('confirm-register/:publicKey/:otpCode')
    async confirmRegister(@Param('publicKey') publicKey: string, @Param('otpCode', ParseIntPipe) otpCode: number): Promise<AuthenticatedUser> {
      const otpValidated = await this.authService.validateOtpCode(publicKey, otpCode);
      const user = await this.authService.enableUserAndCreateFolder(otpValidated.user.id, otpValidated.abiCode);
      return this.authService.login(user);
    }
}