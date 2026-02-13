import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientRustPanicError,
)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientInitializationError
      | Prisma.PrismaClientRustPanicError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          const status = HttpStatus.BAD_REQUEST; // E2E tests expect 400 for duplicate email during registration
          response.status(status).json({
            statusCode: status,
            message: `Unique constraint failed on the fields: ${((exception.meta as Record<string, string[]>)?.target || []).join(', ')}`,
            error: 'Bad Request',
          });
          return;
        }
        case 'P2025': {
          const status = HttpStatus.NOT_FOUND;
          response.status(status).json({
            statusCode: status,
            message: exception.message || 'Record not found',
            error: 'Not Found',
          });
          return;
        }
        default:
          this.logger.error(
            `Unhandled Prisma Known Error [${exception.code}]: ${exception.message}`,
            exception.stack,
          );
      }
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(`Prisma Initialization Error: ${exception.message}`, exception.stack);
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection failed. Please try again later.',
        error: 'Service Unavailable',
      });
      return;
    }

    this.logger.error(`Unexpected Prisma Error: ${exception.message}`, exception.stack);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
