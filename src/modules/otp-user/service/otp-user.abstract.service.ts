/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { OtpUser } from "../entity/otp-user.schema";

@Injectable()
export abstract class OtpUserAbstractService {
    abstract create(user: string): Promise<OtpUser>;
    abstract findOneAndDelete(otpCode: number): Promise<OtpUser>;

    createRandomCode(): number {
        // Crea 3 byte casuali e convertili in un numero decimale
        const buffer = randomBytes(3);
        const codice = parseInt(buffer.toString('hex'), 16) % 900000 + 100000;
        return codice; // Converte il numero in una stringa
    }
}