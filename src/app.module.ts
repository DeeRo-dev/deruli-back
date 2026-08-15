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
        if (!configService.get<string>('JWT_SECRET')) {
          throw new Error('JWT_SECRET no está definido en el archivo .env');
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
