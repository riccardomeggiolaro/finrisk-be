/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { ExternalServiceException } from 'src/core/exceptions/external-service.exception';

@Injectable()
export class GoogleEmailService {
  private readonly GOOGLE_EMAIL: string;
  private readonly GOOGLE_APP_PASSWORD: string;

  constructor(private readonly configService: ConfigService) {
    this.GOOGLE_EMAIL = this.configService.get<string>('GOOGLE_EMAIL');
    this.GOOGLE_APP_PASSWORD = this.configService.get<string>('GOOGLE_APP_PASSWORD');
  }

  async sendConfirmationEmail(nameService: string, action: 'Login' | 'Register' | 'Recovery', email: string, token: number | string): Promise<void> {
    try {
      const transporter = createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com', // Corretto il typo in 'smtp'
        port: 465,
        secure: true,
        auth: {
          user: this.GOOGLE_EMAIL,
          pass: this.GOOGLE_APP_PASSWORD
        }
      })
  
      const emailOptions = {
        from: {
          name: nameService,
          address: this.GOOGLE_EMAIL
        },
        to: [email],
        subject: `${action} ${action === 'Recovery' ? 'Password' : 'Confirmation'}`,
        html: `${action === 'Recovery' || 'Register' ? 
          `<b>Hello</b>, please user this new password <strong>${token}</strong> to enter on your account and then remember to change it` : 
          `<b>Hello</b>, please confirm your ${action.toLowerCase()} using this otp code: <strong>${token}</strong>`}`,
        attachments: []
      }
      
      await transporter.sendMail(emailOptions);
    } catch (err) {
      throw new ExternalServiceException(err.message, 'gmail');
    }
  }
}