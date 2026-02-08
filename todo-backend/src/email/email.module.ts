import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Resend } from 'resend';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    ...(process.env.REDIS_HOST
      ? [
        BullModule.registerQueue({
          name: 'email',
        }),
      ]
      : []),
  ],
  providers: [
    EmailService,
    EmailProcessor,
    {
      provide: 'RESEND_CLIENT',
      useFactory: (config: ConfigService) => {
        return new Resend(config.get('RESEND_API_KEY'));
      },
      inject: [ConfigService],
    },
    ...(process.env.REDIS_HOST
      ? []
      : [
        {
          provide: getQueueToken('email'),
          useValue: {
            add: async () => { },
            process: async () => { },
          },
        },
      ]),
  ],
  exports: [EmailService],
})
export class EmailModule { }
