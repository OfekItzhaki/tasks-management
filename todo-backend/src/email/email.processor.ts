import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'sendVerificationEmail':
        return this.handleSendVerificationEmail(job.data);
      case 'sendReminderEmail':
        return this.handleSendReminderEmail(job.data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleSendReminderEmail(data: {
    email: string;
    taskDescription: string;
    message: string;
    title: string;
  }) {
    const { email, taskDescription, message, title } = data;
    this.logger.log(`Processing reminder email for: ${email}`);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: title,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h1 style="color: #4f46e5;">Horizon Tasks</h1>
            <h2 style="color: #333;">Task Reminder</h2>
            <p><strong>Task:</strong> ${taskDescription}</p>
            <p>${message}</p>
          </div>
        </body>
        </html>
      `,
        text: `
        Task Reminder: ${taskDescription}
        
        ${message}
      `,
      });
      this.logger.log(`Successfully sent reminder email to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reminder email to ${email}:`, error.stack);
      throw error;
    }
  }

  private async handleSendVerificationEmail(data: {
    email: string;
    otp: string;
    name?: string;
  }) {
    const { email, otp, name } = data;
    this.logger.log(`Processing verification email for: ${email}`);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Horizon Tasks',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h1 style="color: #4f46e5;">Horizon Tasks</h1>
            <h2 style="color: #333;">Verify your email address</h2>
            ${name ? `<p>Hello ${name},</p>` : '<p>Hello,</p>'}
            <p>Thank you for signing up! Please verify your email address by entering the 6-digit code below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4f46e5; color: white; padding: 12px 24px; font-size: 24px; font-weight: bold; border-radius: 5px; display: inline-block; letter-spacing: 5px;">${otp}</div>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
      `,
        text: `
        Verify your email address
        
        Hello${name ? ` ${name}` : ''},
        
        Thank you for signing up! Please verify your email address by using this 6-digit code:
        ${otp}
        
        This code will expire in 5 minutes.
        
        If you didn't create an account, you can safely ignore this email.
      `,
      });
      this.logger.log(`Successfully sent verification email to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error.stack);
      throw error; // BullMQ will retry based on config
    }
  }
}
