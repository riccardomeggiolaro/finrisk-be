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
    private emailService: EmailAbstractService,
  ) {}

  async sendConfirmationLogin(user: User): Promise<OtpAbiUser> {
    await this.otpAbiUserService.deleteByUserId(user.id); // Delete all previous otp of this user
    const confirmationOtp = await this.otpAbiUserService.create(user.id);
    const nameFolderParent = await this.driveService.findFolderById(user.folderParent);
    await this.emailService.sendConfirmationEmail(nameFolderParent.name, 'Login', user.username, confirmationOtp.otpCode);
    return confirmationOtp;
  }

  async sendConfirmationRegister(user: User, password: string): Promise<void> {
    const nameFolderParent = await this.driveService.findFolderById(user.folderParent);
    await this.emailService.sendConfirmationEmail(nameFolderParent.name, 'Register', user.username, password);
  }

  async resendConfirmationOtp(publicKey: string, folderParent: string): Promise<OtpAbiUser> {
    const reloadConfirmationOtp = await this.otpAbiUserService.reloadOtp(publicKey);
    const nameFolderParent = await this.driveService.findFolderById(folderParent);
    if (!reloadConfirmationOtp) throw new BadRequestException('Public key to reload otp code is not valid');
    await this.emailService.sendConfirmationEmail(nameFolderParent.name, 'Login', reloadConfirmationOtp.user.username, reloadConfirmationOtp.otpCode);    
    return reloadConfirmationOtp;
  }

  async sendRecoveryPassword(email: string, folderParent: string): Promise<void> {
    const user = await this.userService.findByUsername(email, folderParent);
    if (!user) throw new NotFoundException('Email not found');
    const generatePassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(generatePassword, 10);
    const nameFolderParent = await this.driveService.findFolderById(folderParent);
    await this.userService.update(user.id, { hashedPassword });
    await this.emailService.sendConfirmationEmail(nameFolderParent.name, 'Recovery', email, generatePassword as string)
  }

  generatePassword(length: number = 8): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters[randomIndex];
    }
    return password;
  }

  async changePassword(userId: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.userService.update(userId, { hashedPassword });
  }

  async validateOtpCode(publicKey: string, otpCode: number): Promise<OtpAbiUser> {
    const otpAbiUser = await this.otpAbiUserService.findOneAndDelete(publicKey, otpCode);
    if (!otpAbiUser) throw new UnauthorizedException('Invalid or expired opt code');
    return otpAbiUser;
  }

  async validateUser(username: string, password: string, folderParent: string): Promise<iUser> {
    // console.log("Request Body from validateUser", {
    //   username,
    //   password,
    //   folderParent
    // })
    const identity = await this.userService.findByUsername(username, folderParent);
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

  async register(user: AddUserDTO, password: string): Promise<iUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: User = omit(user, 'password', 'abiCode');
    const usersCount = await this.userService.counterUsers();
    const folderParent = user.folderParent;
    const nameFolderParent = await this.driveService.findFolderById(user.folderParent);
    const abiCodeId = (await this.driveService.createFolder(user.abiCode, user.folderParent)).id;
    const abiCodeElaboratedId = (await this.driveService.createFolder(nameFolderParent.name, abiCodeId)).id;
    if (usersCount === 0) userData.role = Role.Admin;
    else userData.role = Role.Customer;
    const newUser = await this.userService.create({
      ...userData,
      hashedPassword,
      folderParent,
      abiCodeId,
      abiCodeElaboratedId,
      enabled: true
    });
    return omit(newUser, 'hashedPassword');
  }
}