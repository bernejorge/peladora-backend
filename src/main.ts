import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('Mi API')
    .setDescription('Documentación API con Swagger')
    .setVersion('1.0')
    // .addBearerAuth() // si querés auth JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Monta Swagger UI en la ruta /api-docs (puede ser otra)
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(`Server running at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api-docs`);
}
bootstrap();
