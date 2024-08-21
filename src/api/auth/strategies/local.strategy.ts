/* eslint-disable prettier/prettier */
import { Injectable, Request, UnauthorizedException } from '@nestjs/common';
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
      return await this.authService.validateUser(username, password);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials. Please check your username and password.');
    }
  }
}