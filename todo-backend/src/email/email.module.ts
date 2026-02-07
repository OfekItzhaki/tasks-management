import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    ...(process.env.NODE_ENV === 'test'
      ? []
      : [
          MailerModule.forRootAsync({
            useFactory: (config: ConfigService) => ({
              transport: {
                host: config.get('SMTP_HOST'),
                port: config.get('SMTP_PORT'),
                secure: config.get('SMTP_SECURE') === 'true',
                auth: {
                  user: config.get('SMTP_USER'),
                  pass: config.get('SMTP_PASSWORD'),
                },
              },
              defaults: {
                from: `"Tasks Management" <${config.get('SMTP_FROM') || config.get('SMTP_USER') || 'noreply@tasksmanagement.com'}>`,
              },
            }),
            inject: [ConfigService],
          }),
        ]),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [
    EmailService,
    EmailProcessor,
    ...(process.env.NODE_ENV === 'test'
      ? [
          {
            provide: MailerService,
            useValue: { sendMail: jest.fn().mockResolvedValue(true) },
          },
        ]
      : []),
  ],
  exports: [EmailService],
})
export class EmailModule {}
