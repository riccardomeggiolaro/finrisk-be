/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role, User, UserAbstractService } from '@modules/user';
import { omit } from 'lodash';
import { DriveAbstractService } from '@modules/drive';
import { AuthenticatedUser, iUser } from './entity/auth.interface';
import { AddUserDTO } from './entity/auth.dto';
import { OtpAbiUser, OtpAbiUserAbstractService } from '@modules/otp-abi-user';
import { EmailAbstractService } from '@modules/email';

@Injectable()
export class AuthService {
  
  constructor(
    private userService: UserAbstractService,
    private jwtService: JwtService,
    private driveService: DriveAbstractService,
    private otpAbiUserService: OtpAbiUserAbstractService,
    private emailService: EmailAbstractService
  ) {}

  async sendConfirmationLogin(user: User): Promise<OtpAbiUser> {
    const confirmationOtp = await this.otpAbiUserService.create(user.id);
    await this.emailService.sendConfirmationEmail('Login', user.username, confirmationOtp.otpCode);
    return confirmationOtp;
  }

  async sendConfirmationRegister(user: User, abiCode: string): Promise<OtpAbiUser> {
    const confirmationOtp = await this.otpAbiUserService.create(user.id, abiCode);
    await this.emailService.sendConfirmationEmail('Register', user.username, confirmationOtp.otpCode);
    return confirmationOtp;
  }

  async validateOtpCode(publicKey: string, otpCode: number): Promise<OtpAbiUser> {
    const otpAbiUser = await this.otpAbiUserService.findOneAndDelete(publicKey, otpCode);
    if (!otpAbiUser) throw new UnauthorizedException('Invalid or expired opt code');
    return otpAbiUser;
  }

  async enableUserAndCreateFolder(userId: string, abiCode: string): Promise<User> {
    const abiCodeId = (await this.driveService.createFolder(abiCode)).id;
    return await this.userService.update(userId, { enabled: true, abiCodeId });
  }

  async validateUser(username: string, password: string): Promise<iUser> {
    const identity = await this.userService.findByUsername(username, true);
    if(!identity) throw new NotFoundException(`User with username ${username} not found`);
    const match = await bcrypt.compare(password, identity.hashedPassword);
    if (!match) throw new UnauthorizedException(`Invalid password for user with username ${username}`);
    return identity;
  }

  async login(user: User): Promise<AuthenticatedUser> {
    const userData = omit(user, 'hashedPassword');
    return {
      ...userData,
      access_token: await this.jwtService.signAsync(userData)
    };
  }

  async register(user: AddUserDTO): Promise<iUser> {
    const existingIdentity = await this.userService.findByUsername(user.username);
    if (existingIdentity) throw new BadRequestException('Username already exists');
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userData: User = omit(user, 'password', 'abiCode');
    const usersCount = await this.userService.counterUsers();
    if (usersCount === 0) userData.role = Role.Admin;
    else userData.role = Role.Customer;
    const newUser = await this.userService.create({
      ...userData,
      enabled: false,
      hashedPassword,
    });
    return omit(newUser, 'hashedPassword');
  }
}