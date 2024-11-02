/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { Public } from 'src/core/decorators/is.public.decorator';
import { User } from 'src/core/decorators/user.decorator';
import { LocalAuthGuard } from 'src/core/guards/local-auth.guard';
import { AddUserDTO, RecoveryPasswordDTO, LoginDTO } from '@api/auth/entity/auth.dto';
import { AuthService } from './auth.service';
import { AuthenticatedUser, iUser } from './entity/auth.interface';
import { EmailValidationPipe } from 'src/core/pipes/email-validation.pipe';
import { MinLengthPipe } from 'src/core/pipes/min-length.pipe';
import { IsAdminGuard } from 'src/core/guards/is-admin.guard';

@Controller('auth')
export class AuthController {

    constructor(
      private authService: AuthService
    ) {}

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Body() body: LoginDTO, @User() user: iUser): Promise<{ message: string, publicKey: string } | AuthenticatedUser> {
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

    @Post('register')
    @UseGuards(IsAdminGuard)
    async register(@Body() addUserDTO: AddUserDTO): Promise<iUser> {
      const generateRandomPassword = this.authService.generatePassword();
      const user = await this.authService.register(addUserDTO, generateRandomPassword);
      await this.authService.sendConfirmationRegister(user, generateRandomPassword);
      return user;
    }

    @Public()
    @Post('send-recovery-password/:email')
    async recoveryPassword(@Param('email', EmailValidationPipe) email: string, @Body() body: RecoveryPasswordDTO): Promise<{ message: string }> {
      await this.authService.sendRecoveryPassword(email, body.folderParent);
      return { message: `New password sent to email ${email}` };
    }

    @Get('change-password/:password')
    async changePassword(@User() user: iUser, @Param('password', new MinLengthPipe(8)) password: string): Promise<{ message: string }> {
      await this.authService.changePassword(user.id, password);
      return { message: 'New password set' };
    }
}