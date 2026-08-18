import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlacesModule } from './places/places.module';
import { TablesModule } from './tables/tables.module';
import { OutingsModule } from './outings/outings.module';
import { MealsModule } from './meals/meals.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ScoringModule } from './scoring/scoring.module';
import { StorageModule } from './storage/storage.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { buildDataSourceOptions } from './config/data-source';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        /* No se nombra el .env: en un hosting las variables vienen del
           panel, y mandar a buscar un archivo que no existe hace perder
           tiempo. */
        if (!configService.get<string>('JWT_SECRET')) {
          throw new Error(
            'Falta la variable de entorno JWT_SECRET. En local va en .env; ' +
              'en Render, en Environment.',
          );
        }

        // Misma config que usa el CLI de migraciones, para que runtime y
        // migraciones nunca se desincronicen.
        return {
          ...buildDataSourceOptions(),

          /* Los reintentos son de @nestjs/typeorm, no de TypeORM: por eso
             van acá y no en el data source que comparte con el CLI.

             Por defecto son 10. Con una credencial equivocada eso da 10
             fallos de autenticación por arranque, y como el hosting
             reinicia el proceso caído queda un bucle que termina en el
             "too many authentication failures" de Supabase.

             Con 2, un corte de red pasajero se salva igual, pero una
             credencial mal falla rápido en vez de martillar la base. */
          retryAttempts: Number(configService.get('DB_RETRY_ATTEMPTS') ?? 2),
          retryDelay: 2000,
        };
      },
    }),

    // Global: lo consumen users, places, tables y meals.
    StorageModule,

    AuthModule,
    UsersModule,
    PlacesModule,
    TablesModule,
    OutingsModule,
    MealsModule,
    FavoritesModule,
    ScoringModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
