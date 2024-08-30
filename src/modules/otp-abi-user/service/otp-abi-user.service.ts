/* eslint-disable prettier/prettier */
import { OtpAbiUserAbstractService } from "./otp-abi-user.abstract.service";
import { InjectModel } from "@nestjs/mongoose";
import { OtpAbiUser } from "../entity/otp-abi-user.schema";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";

@Injectable()
export class OtpAbiUserService extends OtpAbiUserAbstractService {

    constructor(@InjectModel(OtpAbiUser.name) private otpAbiUserSchema: Model<OtpAbiUser>) {
        super();
    }

    async create(user: string, abiCode?: string): Promise<OtpAbiUser> {
        const data: object = {
            user
        }
        if (abiCode) data["abiCode"] = abiCode;
        return await this.otpAbiUserSchema.create(data);
    }

    async findOneAndDelete(publicKey: string, otpCode: number): Promise<OtpAbiUser> {
        const findOne = await this.otpAbiUserSchema.findOneAndDelete({publicKey, otpCode});
        return findOne ? findOne.toObject() : null;
    }

    async findByAbiCode(abiCode: string): Promise<OtpAbiUser> {
        const findOne = await this.otpAbiUserSchema.findOne({abiCode});
        return findOne ? findOne.toObject() : null;
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.otpAbiUserSchema.deleteMany({user: userId});       
    }

    async reloadOtp(publicKey: string): Promise<OtpAbiUser> {
        const newOtpCode = (): number => {
            const buffer = randomBytes(3);
            const code = parseInt(buffer.toString('hex'), 16) % 900000 + 100000;
            return code;
        };
        return await this.otpAbiUserSchema.findOneAndUpdate({publicKey}, {otpCode: newOtpCode()}, {new: true});
    }
}