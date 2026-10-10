import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: 'http://localhost:3001',
  });

  const swagger = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setVersion('1.0')
    .addServer('http://localhost:3000')
    .addSecurity('bearer', { type: 'http', scheme: 'bearer' })
    .addBearerAuth()
    .build();
  const documentation = SwaggerModule.createDocument(
    app,
    swagger,
  );
  SwaggerModule.setup('/api-docs', app, documentation);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
