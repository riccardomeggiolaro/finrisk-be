/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class EmailAbstractService {
    abstract sendConfirmationEmail(action: 'Login' | 'Register' | 'Recovery', email: string, token: number | string): Promise<void>;
}