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

    /* Supabase (y casi cualquier Postgres administrado) exige TLS. Sin
       esto la conexión se rechaza apenas arranca.

       `rejectUnauthorized: false` acepta el certificado sin validar la
       cadena. Es lo habitual con Supabase porque usa una CA propia que
       Node no trae; el tráfico va cifrado igual, pero no protege contra
       un man-in-the-middle. Para endurecerlo hay que pasar el certificado
       de Supabase en `ca`. */
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

    /* Corre las migraciones pendientes al arrancar. Cómodo en Render:
       cada deploy actualiza el esquema solo. Ojo si algún día escalás a
       varias instancias, porque arrancarían a la vez. */
    migrationsRun: env.DB_MIGRATIONS_RUN === 'true',
  };
}

/** Export por defecto que busca el CLI de TypeORM. */
export default new DataSource(buildDataSourceOptions());
