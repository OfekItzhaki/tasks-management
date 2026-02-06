import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) { }

  async sendVerificationEmail(
    email: string,
    otp: string,
    name?: string,
  ): Promise<void> {
    console.log(`[EmailService] Queueing OTP email for: ${email}`);
    await this.emailQueue.add('sendVerificationEmail', {
      email,
      otp,
      name,
    });
  }

  async sendReminderEmail(
    email: string,
    taskDescription: string,
    message: string,
    title: string,
  ): Promise<void> {
    console.log(`[EmailService] Queueing reminder email for: ${email}`);
    await this.emailQueue.add('sendReminderEmail', {
      email,
      taskDescription,
      message,
      title,
    });
  }
}
