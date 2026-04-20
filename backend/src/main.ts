import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const port = configService.get<number>('PORT', 3000);

  app.setGlobalPrefix('api/v1');
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
  );

  /**
   * Fix 12: CORS — wildcard '*' is forbidden in production.
   * CORS_ORIGIN must be explicitly configured; a missing value in production
   * causes a hard startup failure so the misconfiguration cannot be silently
   * shipped.
   */
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  if (isProduction && !corsOrigin) {
    throw new Error(
      'CORS_ORIGIN must be set in production (e.g. https://yourdomain.com)',
    );
  }
  app.enableCors({
    origin: corsOrigin ?? '*', // '*' only reached in non-production environments
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  /**
   * Fix 14: Swagger disabled in production.
   * Publicly exposing API schema leaks endpoint structure and auth mechanics.
   * Run NODE_ENV=development (or staging) to access /api/docs.
   */
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Car Rental Marketplace API')
      .setDescription('Car Rental Marketplace REST API — development only')
      .setVersion('2.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
      .addTag('Auth')
      .addTag('Users')
      .addTag('Cars')
      .addTag('Bookings')
      .addTag('Payments')
      .addTag('Notifications')
      .addTag('Audit Logs')
      .addTag('Uploads')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}/api/v1`);
}
bootstrap();
