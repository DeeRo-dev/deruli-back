import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlacesModule } from './places/places.module';

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
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<number>('DB_PORT');
        const dbUsername = configService.get<string>('DB_USERNAME');
        const dbPassword = configService.get<string>('DB_PASSWORD');
        const dbDatabase = configService.get<string>('DB_DATABASE');
        const jwtSecret = configService.get<string>('JWT_SECRET');

        if (!dbHost || !dbUsername || !dbPassword || !dbDatabase) {
          throw new Error(
            'Faltan variables de entorno de la base de datos:\n' +
              `DB_HOST: ${dbHost ? 'chack' : 'x'}\n` +
              `DB_USERNAME: ${dbUsername ? 'check' : 'x'}\n` +
              `DB_PASSWORD: ${dbPassword ? 'check' : 'x'}\n` +
              `DB_DATABASE: ${dbDatabase ? 'check' : 'x'}`,
          );
        }

        if (!jwtSecret) {
          throw new Error('JWT_SECRET no está definido en el archivo .env');
        }

        return {
          type: 'postgres',
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: true,
        };
      },
    }),

    AuthModule,
    UsersModule,
    PlacesModule,
  ],
})
export class AppModule {}
