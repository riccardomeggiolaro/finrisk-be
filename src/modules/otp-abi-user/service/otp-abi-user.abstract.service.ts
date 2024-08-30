/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { OtpAbiUser } from "../entity/otp-abi-user.schema";

@Injectable()
export abstract class OtpAbiUserAbstractService {
    abstract create(user: string, abiCode?: string): Promise<OtpAbiUser>;
    abstract findOneAndDelete(publicKey: string, otpCode: number): Promise<OtpAbiUser>;
    abstract findByAbiCode(abiCode: string): Promise<OtpAbiUser>;
    abstract deleteByUserId(userId: string): Promise<void>;
    abstract reloadOtp(publicKey: string): Promise<OtpAbiUser>;
}