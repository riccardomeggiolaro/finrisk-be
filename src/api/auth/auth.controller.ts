/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { omit, pick } from 'lodash';
import { Public } from 'src/core/decorators/is.public.decorator';
import { User } from 'src/core/decorators/user.decorator';
import { GoogleOAuthGuard } from 'src/core/guards/google-auth.guard';
import { LocalAuthGuard } from 'src/core/guards/local-auth.guard';
import { User as iUser } from '@modules/user';
import { AddUserDTO } from './auth.dto';
import { AuthService, AuthenticatedUser } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@User() user): Promise<AuthenticatedUser> {
      return await this.authService.login(user);
    }

    @Get('profile')
    async me(@User() user: iUser): Promise<iUser> {
      return user;
    }

    @Public()
    @Post('register')
    async register(@Body() addUserDTO: AddUserDTO): Promise<any>{
      const credentials = pick(addUserDTO, 'username', 'password');
      const user = omit(addUserDTO, 'username', 'password');

      const newUser = await this.authService.register(user, credentials);
      return newUser;
    }

    @Public()
    @Get('google')
    @UseGuards(GoogleOAuthGuard)
    async googleAuth() {}

    @Public()
    @Get('google/redirect')
    @UseGuards(GoogleOAuthGuard)
    async googleAuthRedirect(@User() user) {
      return await this.authService.login(user);
    }
}