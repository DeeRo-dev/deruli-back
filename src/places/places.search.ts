/**
 * Agregación de derulis en SQL, no en memoria.
 *
 * Ordenar por promedio y paginar exige que la base calcule y ordene: traer
 * todos los lugares para promediarlos en Node no escala y además rompe la
 * paginación (habría que leer todo para saber cuáles son los 4 mejores).
 *
 * Los tres niveles del promedio son los mismos que ScoringService:
 * comensal → mesa → lugar.
 */
export const PLACE_STATS_CTE = `
  WITH scores AS (
    SELECT m."outingId" AS outing_id, mr."userId" AS user_id,
           mr."derulis"::numeric AS score
      FROM meal_ratings mr
      JOIN meals m ON m.id = mr."mealId"
    UNION ALL
    SELECT r."outingId", r."userId", r."placeDerulis"::numeric
      FROM outing_ratings r
    UNION ALL
    SELECT r."outingId", r."userId", r."serviceDerulis"::numeric
      FROM outing_ratings r
    UNION ALL
    SELECT r."outingId", r."userId", r."valueDerulis"::numeric
      FROM outing_ratings r
     WHERE r."valueDerulis" IS NOT NULL
  ),
  diner AS (
    SELECT s.outing_id, s.user_id, AVG(s.score) AS score
      FROM scores s
      JOIN outing_guests g
        ON g."outingId" = s.outing_id
       AND g."userId" = s.user_id
       AND g.status = 'going'
     GROUP BY s.outing_id, s.user_id
  ),
  outing_avg AS (
    SELECT outing_id, AVG(score) AS score FROM diner GROUP BY outing_id
  ),
  place_stats AS (
    SELECT o."placeId" AS place_id,
           AVG(oa.score) AS derulis,
           COUNT(*)::int AS visit_count
      FROM outing_avg oa
      JOIN outings o ON o.id = oa.outing_id AND o.status = 'done'
     GROUP BY o."placeId"
  )
`;

export interface PlaceFilters {
  search?: string;
  city?: string;
  province?: string;
  country?: string;
  onlyRated: boolean;
}

/** Devuelve el WHERE y los parámetros, numerados desde `startAt`. */
export function buildPlaceWhere(
  filters: PlaceFilters,
  startAt = 1,
): { sql: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let index = startAt;

  if (filters.search) {
    clauses.push(`p.name ILIKE $${index++}`);
    params.push(`%${filters.search}%`);
  }
  if (filters.city) {
    clauses.push(`p.city ILIKE $${index++}`);
    params.push(filters.city);
  }
  if (filters.province) {
    clauses.push(`p.province ILIKE $${index++}`);
    params.push(filters.province);
  }
  if (filters.country) {
    clauses.push(`p.country ILIKE $${index++}`);
    params.push(filters.country);
  }
  if (filters.onlyRated) {
    clauses.push('ps.derulis IS NOT NULL');
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}
