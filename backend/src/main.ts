import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Lê cookies (usados para os tokens httpOnly de autenticação)
  app.use(cookieParser());

  // Hardening de cabeçalhos HTTP. crossOriginResourcePolicy em "cross-origin"
  // permite que o frontend (outra origem) carregue as imagens de /uploads.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Servir imagens enviadas (uploads) de forma estática em /uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Configuração do CORS. Origens permitidas vêm de CORS_ORIGIN
  // (lista separada por vírgula); por padrão, o dev do Vite.
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Code Connect API')
    .setDescription('API do Code Connect - Sistema de autenticação e posts')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // withCredentials: faz o "Try it out" enviar os cookies httpOnly de sessão,
  // permitindo autenticar no Swagger apenas fazendo /auth/login (sem colar token).
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { withCredentials: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(`🚀 Aplicação rodando em: http://localhost:${port}`, 'Bootstrap');
  Logger.log(
    `📚 Swagger disponível em: http://localhost:${port}/api`,
    'Bootstrap',
  );
}
bootstrap();
