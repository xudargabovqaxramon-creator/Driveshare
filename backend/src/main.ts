import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';

async function bootstrap() {


  const uploadDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('--- Uploads papkasi avtomatik yaratildi ---');
  }
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

  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  if (isProduction && !corsOrigin) {
    throw new Error(
      'CORS_ORIGIN must be set in production (e.g. https://yourdomain.vercel.app)',
    );
  }
  app.enableCors({
    origin: corsOrigin ?? '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger faqat development da
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Car Rental Marketplace API')
      .setDescription('Car Rental Marketplace REST API — development only')
      .setVersion('2.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
      .addTag('Auth').addTag('Users').addTag('Cars')
      .addTag('Bookings').addTag('Payments')
      .addTag('Notifications').addTag('Audit Logs').addTag('Uploads')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }

  // Railway healthcheck uchun — global prefix dan OLDIN qo'shiladi
  // shuning uchun /api/v1/health emas, /health bo'ladi
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // '0.0.0.0' — Railway, Docker va boshqa cloud platformalar uchun ZARUR.
  // Faqat 'localhost' bind bo'lsa, tashqi so'rovlar yetib kelmaydi.
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application running on port ${port}`);
}
bootstrap();
