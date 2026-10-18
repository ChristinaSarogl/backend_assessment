import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { TransformInterceptor } from './utils/transform.interceptor.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Backend assessment API')
    .setDescription(
      'Backend assessment API using NestJS, PostgreSQL and TypeORM.',
    )
    .setVersion('1.0')
    .addTag('Authentication')
    .addTag('Streaming')
    .addBearerAuth({type: 'http', scheme: 'bearer', bearerFormat: 'JWT'}, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      //Upon login save token
      responseInterceptor: (res: any) => {
        if (res.url.endsWith('auth/login') && res.ok){
          try{
            const token = JSON.parse(res.text).data;

            if (token) {
              (window as any).ui.preauthorizeApiKey('access-token', token);
            }
          } catch { }
        }
        
        return res;
      }
    }
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
