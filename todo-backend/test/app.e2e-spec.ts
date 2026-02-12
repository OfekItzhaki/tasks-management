import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EmailService } from '../src/email/email.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider('RESEND_CLIENT')
      .useValue({
        emails: {
          send: jest
            .fn()
            .mockResolvedValue({ data: { id: 'test' }, error: null }),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // No user cleanup needed for basic app health check
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain('Horizon Flux API');
      });
  });
});
