/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class EmailAbstractService {
    abstract sendConfirmationEmail(nameService: string, action: 'Login' | 'Register' | 'Recovery', email: string, token: number | string): Promise<void>;
}