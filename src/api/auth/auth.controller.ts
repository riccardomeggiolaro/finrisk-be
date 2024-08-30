/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { Public } from 'src/core/decorators/is.public.decorator';
import { User } from 'src/core/decorators/user.decorator';
import { LocalAuthGuard } from 'src/core/guards/local-auth.guard';
import { AddUserDTO } from '@api/auth/entity/auth.dto';
import { AuthService } from './auth.service';
import { AuthenticatedUser, iUser } from './entity/auth.interface';
import { EmailValidationPipe } from 'src/core/pipes/email-validation.pipe';
import { MinLengthPipe } from 'src/core/pipes/min-length.pipe';

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

    @Public()
    @Get('resend-confirm/:publicKey')
    async resendConfirm(@Param('publicKey') publicKey: string): Promise<{ message: string, publicKey: string }> {
      const updatedConfirmationOtp = await this.authService.resendConfirmationOtp(publicKey);
      return { message: 'Confirmation email resent', publicKey: updatedConfirmationOtp.publicKey };
    }

    @Public()
    @Get('send-recovery-password/:email')
    async recoveryPassword(@Param('email', EmailValidationPipe) email: string): Promise<{ message: string }> {
      await this.authService.sendRecoveryPassword(email);
      return { message: `New password sent to email ${email}` };
    }

    @Get('change-password/:password')
    async changePassword(@User() user: iUser, @Param('password', new MinLengthPipe(8)) password: string): Promise<{ message: string }> {
      await this.authService.changePassword(user.id, password);
      return { message: 'New password set' };
    }
}