import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const now = Date.now();

    this.logger.log(
      `→ ${method} ${url} | User: ${user?.id || 'anonymous'}`,
    );

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `← ${method} ${url} | ${Date.now() - now}ms`,
        );
      }),
    );
  }
}
