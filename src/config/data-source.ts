import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Única fuente de verdad de la conexión: la usa AppModule en runtime y el
 * CLI de TypeORM para generar y correr migraciones.
 */
export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  const required = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno de la base de datos: ${missing.join(', ')}`,
    );
  }

  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    // Apagado a propósito: el esquema se cambia con migraciones, no
    // dejando que TypeORM adivine. Ponelo en true solo para prototipar.
    synchronize: env.DB_SYNCHRONIZE === 'true',
    logging: env.DB_LOGGING === 'true',
  };
}

/** Export por defecto que busca el CLI de TypeORM. */
export default new DataSource(buildDataSourceOptions());
