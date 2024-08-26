/* eslint-disable prettier/prettier */
import { OtpAbiUserAbstractService } from "./otp-abi-user.abstract.service";
import { InjectModel } from "@nestjs/mongoose";
import { OtpAbiUser } from "../entity/otp-abi-user.schema";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";

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
}