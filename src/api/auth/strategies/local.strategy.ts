/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  
  constructor(private authService: AuthService) {
    super({
      passReqToCallback: true,
    });
  }

  async validate(request: Request, username: string, password: string): Promise<any> {
    try {
      const folderParent = request.body["folderParent"];
      // console.log("LoginDTO from validate", {
      //   username,
      //   password,
      //   folderParent
      // })
      return await this.authService.validateUser(username, password, folderParent);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials. Please check your username and password.');
    }
  }
}