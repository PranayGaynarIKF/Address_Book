import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security middleware - configure helmet to work with CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  
  // CORS configuration - more explicit for development
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-API-Key', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Contacts API')
    .setDescription('Automated Contact Collection & WhatsApp Messaging API. Note: Tag management endpoints are publicly accessible without authentication.')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for ingestion routes',
      },
      'ingestion-api-key',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'WhatsApp API key for WhatsApp messaging endpoints',
      },
      'whatsapp-api-key',
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Contacts', 'Contact management endpoints')
    .addTag('Owners', 'Data owner management endpoints')
    .addTag('Templates', 'Message template management endpoints')
    .addTag('Messages', 'Message sending and webhook endpoints')
    .addTag('Ingestion', 'Data ingestion and processing endpoints')
    .addTag('Email', 'Email service management endpoints')
    .addTag('Mail Accounts', 'Mail account management endpoints')
    .addTag('WhatsApp', 'WhatsApp messaging endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
    },
    customCss: `
      /* Style the Swagger UI */
      .swagger-ui .info {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .swagger-ui .info hgroup.main {
        border-bottom: 2px solid #4CAF50;
        padding-bottom: 10px;
      }
      
      .swagger-ui .info hgroup.main h1 {
        color: #2c3e50;
        font-size: 28px;
        font-weight: 600;
      }
      
      .swagger-ui .info hgroup.main h2 {
        color: #7f8c8d;
        font-size: 16px;
        font-weight: 400;
      }
      
      /* Style the endpoints */
      .swagger-ui .opblock {
        border-radius: 6px;
        margin-bottom: 10px;
      }
      
      .swagger-ui .opblock.opblock-post {
        border-color: #4CAF50;
        background-color: rgba(76, 175, 80, 0.1);
      }
      
      .swagger-ui .opblock.opblock-get {
        border-color: #2196F3;
        background-color: rgba(33, 150, 243, 0.1);
      }
      
      .swagger-ui .opblock.opblock-put {
        border-color: #FF9800;
        background-color: rgba(255, 152, 0, 0.1);
      }
      
      .swagger-ui .opblock.opblock-delete {
        border-color: #F44336;
        background-color: rgba(244, 67, 54, 0.1);
      }
    `,
    customSiteTitle: 'Contacts API Documentation',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/docs`);
}

bootstrap();
