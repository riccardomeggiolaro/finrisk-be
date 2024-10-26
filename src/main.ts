/* eslint-disable prettier/prettier */
import { useContainer } from 'class-validator';
import { NestFactory, Reflector } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import fastifyCors from '@fastify/cors';
import fastifyCsrf  from '@fastify/csrf-protection';
import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { RoleGuard } from './core/guards/role.guard';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.register(fastifyCors as any, {
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Content-Length', 'Content-Disposition'],
    credentials: true,
  });
  app.register(helmet as any);
  app.register(fastifyCsrf as any);
  app.register(compression as any);
  app.setGlobalPrefix('api');
  app.useGlobalGuards(new RoleGuard(new Reflector()));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    })
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();