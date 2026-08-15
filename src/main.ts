import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sin esto el navegador bloquea el preflight OPTIONS y ninguna request
  // del front llega al controlador.
  const origins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Sin esto los decoradores de class-validator en los DTO no se ejecutan.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Aplica los @Exclude de las entidades: sin esto, una relación que
  // arrastre el User entero devuelve el hash de la contraseña.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  /* '0.0.0.0' es obligatorio en Render: si escucha solo en localhost, el
     balanceador no llega y el deploy queda "en vivo" pero sin responder.
     El puerto lo inyecta Render por env, no hay que fijarlo a mano. */
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
