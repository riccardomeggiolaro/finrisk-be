/* eslint-disable prettier/prettier */
import { OtpUserAbstractService } from "./otp-user.abstract.service";
import { InjectModel } from "@nestjs/mongoose";
import { OtpUser } from "../entity/otp-user.schema";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OtpUserService extends OtpUserAbstractService {

    constructor(@InjectModel(OtpUser.name) private otpUserSchema: Model<OtpUser>) {
        super();
    }

    async create(user: string): Promise<OtpUser> {
        const randomOtpCode = this.createRandomCode();
        return await this.otpUserSchema.create({user, otpCode: randomOtpCode});
    }

    async findOneAndDelete(otpCode: number): Promise<OtpUser> {
        const findOne = await this.otpUserSchema.findOneAndDelete({otpCode});
        return findOne ? findOne.toObject() : null;
    }
}