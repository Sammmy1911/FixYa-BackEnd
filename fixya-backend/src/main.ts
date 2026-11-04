import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilita validación automática de DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  
  // Habilita CORS para el frontend
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3001' });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();