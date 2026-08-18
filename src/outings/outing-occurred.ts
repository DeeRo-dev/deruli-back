import { Raw } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import type { Outing } from './outing.entity';

/**
 * Zona horaria del producto. Las fechas de las salidas se guardan como hora
 * de pared (`timestamp` sin zona), así que "qué día es hoy" hay que
 * resolverlo acá y no dejárselo al servidor: la sesión de Postgres corre en
 * GMT incluso en desarrollo, y Render también. Sin esto, entre las 21:00 y
 * la medianoche una cena de esa misma noche ya contaría como del día
 * anterior.
 */
export const APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Una salida se da por ocurrida **al día siguiente de su fecha**, no al
 * pasar la hora: mientras la mesa está comiendo, la salida sigue siendo la
 * de hoy.
 *
 * Se calcula en la consulta y no en una constante de módulo a propósito:
 * el proceso vive días entre reinicios, y un corte congelado al arrancar
 * dejaría de moverse a la medianoche.
 */
const TODAY_START_SQL = `date_trunc('day', now() AT TIME ZONE '${APP_TIMEZONE}')`;

/**
 * Predicado SQL: la salida ya ocurrió.
 *
 * Es el reemplazo de `status = 'done'` en todo lo que pregunta "¿esta mesa
 * ya estuvo ahí?": el promedio del lugar, el permiso para subir fotos, las
 * estadísticas del perfil y el historial de la mesa. Antes todo eso
 * dependía de que alguien se acordara de apretar "Cerrar la salida", y si
 * no lo apretaba las reseñas cargadas no contaban en ningún lado.
 *
 * `done` sigue valiendo aunque la fecha no haya pasado: si la mesa la
 * cerró a mano, ya está.
 */
export function occurredSql(alias = 'o'): string {
  return `(${alias}.status = 'done'
           OR (${alias}.status = 'planned'
               AND ${alias}."dateTime" < ${TODAY_START_SQL}))`;
}

/** Lo contrario: sigue siendo una salida por venir. */
export function upcomingSql(alias = 'o'): string {
  return `(${alias}.status = 'planned'
           AND ${alias}."dateTime" >= ${TODAY_START_SQL})`;
}

/** El día de hoy en la zona del producto, como "YYYY-MM-DD". */
export function today(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * El día de la salida, como "YYYY-MM-DD".
 *
 * Usa los getters locales a propósito: `node-postgres` interpreta un
 * `timestamp` sin zona con la hora local del proceso, así que estos
 * getters devuelven exactamente la hora de pared que está guardada. Pasar
 * por UTC acá correría la fecha un día.
 */
function outingDay(dateTime: Date): string {
  const year = dateTime.getFullYear();
  const month = `${dateTime.getMonth() + 1}`.padStart(2, '0');
  const day = `${dateTime.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * La versión en memoria de `occurredSql`, para filtrar salidas ya traídas.
 * Las dos tienen que decir lo mismo: si cambia una, cambia la otra.
 */
export function hasOccurred(
  outing: Pick<Outing, 'status' | 'dateTime'>,
): boolean {
  if (outing.status === 'done') return true;
  if (outing.status !== 'planned') return false;

  return outingDay(outing.dateTime) < today();
}

/**
 * Lo mismo que `occurredSql`, en la forma que entienden los `find` de
 * TypeORM. El array es un OR: cerrada a mano, o con la fecha ya pasada.
 */
export function occurredWhere(
  base: FindOptionsWhere<Outing>,
): FindOptionsWhere<Outing>[] {
  return [
    { ...base, status: 'done' },
    {
      ...base,
      status: 'planned',
      dateTime: Raw((alias) => `${alias} < ${TODAY_START_SQL}`),
    },
  ];
}

/** La contraparte de `upcomingSql` para los `find`. */
export function upcomingWhere(
  base: FindOptionsWhere<Outing>,
): FindOptionsWhere<Outing> {
  return {
    ...base,
    status: 'planned',
    dateTime: Raw((alias) => `${alias} >= ${TODAY_START_SQL}`),
  };
}

/**
 * Salidas que ya ocurrieron pero que la mesa todavía no cerró: son las que
 * están esperando que alguien cargue lo que comieron.
 */
export function pendingWhere(
  base: FindOptionsWhere<Outing>,
): FindOptionsWhere<Outing> {
  return {
    ...base,
    status: 'planned',
    dateTime: Raw((alias) => `${alias} < ${TODAY_START_SQL}`),
  };
}
