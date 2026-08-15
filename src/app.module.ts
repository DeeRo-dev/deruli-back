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
import { ScoringModule } from './scoring/scoring.module';
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
        return buildDataSourceOptions();
      },
    }),

    AuthModule,
    UsersModule,
    PlacesModule,
    TablesModule,
    OutingsModule,
    MealsModule,
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
