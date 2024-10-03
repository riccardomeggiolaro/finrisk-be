/* eslint-disable prettier/prettier */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RunDriveScriptsService {
    private NGROK_URL: string;
    
    constructor(
        private configService: ConfigService,
        private httpService: HttpService
    ) {
        this.NGROK_URL = this.configService.get<string>('NGROK');
    }

    async elaborateAllFiles(abicode: string): Promise<{ message: string, errors?: string[] }> {
        const url = `${this.NGROK_URL}?ABICODE=${abicode}`;
        try {
            const response = await this.httpService.get(url).toPromise();
            return response.data;
        } catch (error) {
            throw new Error(`Error during HTTP GET: ${error.message}`);
        }
    }
}
