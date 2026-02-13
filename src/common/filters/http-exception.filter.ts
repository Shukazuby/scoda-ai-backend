import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

/**
 * Global HTTP exception filter to normalize API error responses.
 *
 * All errors are returned in the following JSON shape:
 * {
 *   statusCode: number;
 *   message: string | string[];
 *   error: string;
 *   path: string;
 *   timestamp: string;
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let error = "InternalServerError";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as
        | string
        | {
            message?: string | string[];
            error?: string;
            [key: string]: any;
          };

      if (typeof res === "string") {
        message = res;
      } else {
        // ValidationPipe returns message as string[]
        message = res.message ?? message;
        error = res.error ?? error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name || error;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

