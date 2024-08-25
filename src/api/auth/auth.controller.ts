/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { Public } from 'src/core/decorators/is.public.decorator';
import { User } from 'src/core/decorators/user.decorator';
import { LocalAuthGuard } from 'src/core/guards/local-auth.guard';
import { AbiCodeDTO, AddUserDTO } from '@api/auth/entity/auth.dto';
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
    async login(@User() user: iUser): Promise<{ message: string }> {
      await this.authService.sendOtpCodeEmailConfirmation('Login', user);
      // Risponde immediatamente al client con il token
      return { message: 'Confirmation email sent' };
    }
    
    @Public()
    @Get('confirm-login/:otpCode')
    async confirmLogin(@Param('otpCode', ParseIntPipe) otpCode: number): Promise<AuthenticatedUser> {
      const user = await this.authService.validateOtpCode(otpCode);
      return await this.authService.login(user);
    }

    @Get('profile')
    async me(@User() user: iUser): Promise<iUser> {
      return user;
    }

    @Public()
    @Post('register')
    async register(@Body() addUserDTO: AddUserDTO): Promise<any>{
      const user = await this.authService.register(addUserDTO);
      await this.authService.sendOtpCodeEmailConfirmation('Register', user);
      return { message: 'Confirmation email sent' };
    }

    @Public()
    @Post('confirm-register/:otpCode')
    async confirmRegister(@Param('otpCode', ParseIntPipe) otpCode: number, @Body() body: AbiCodeDTO): Promise<AuthenticatedUser> {
      const userId = (await this.authService.validateOtpCode(otpCode)).id;
      const user = await this.authService.enableUserAndAddAbiCode(userId, body.abiCode);
      return this.authService.login(user);
    }
}