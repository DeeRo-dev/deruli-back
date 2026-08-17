import { Injectable, Logger } from '@nestjs/common';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Lo que devuelve Nominatim en /search con format=json. */
interface NominatimResult {
  lat: string;
  lon: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * La política de uso de Nominatim exige identificar la aplicación. Sin un
 * User-Agent propio devuelve 403.
 */
const USER_AGENT = 'Derulis/1.0 (https://github.com/derulis)';

/** Si tarda más que esto, no vale la pena hacer esperar a nadie. */
const TIMEOUT_MS = 5000;

/**
 * Traduce una dirección escrita a coordenadas.
 *
 * Es un servicio externo con límites de uso, así que el resultado se guarda
 * (ver `PlacesService.locate`) y cada lugar se consulta una sola vez. Ojo:
 * con direcciones sueltas —"Calle 1 100", sin ciudad— el resultado puede
 * caer en otro país. Por eso siempre se acota con la ciudad y el país que
 * tenga cargados el lugar.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocode(parts: {
    address: string;
    city?: string | null;
    province?: string | null;
    country?: string | null;
  }): Promise<Coordinates | null> {
    const query = [parts.address, parts.city, parts.province, parts.country]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(', ');

    if (!query) return null;

    const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn(
          `Nominatim respondió ${response.status} para "${query}"`,
        );
        return null;
      }

      const results = (await response.json()) as NominatimResult[];
      const first = results[0];
      if (!first) return null;

      const latitude = Number(first.lat);
      const longitude = Number(first.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return { latitude, longitude };
    } catch (error) {
      /* Que el geocoder falle no puede tumbar la pantalla del lugar: el
         lugar simplemente se queda sin punto en el mapa. */
      this.logger.warn(
        `No se pudo geocodificar "${query}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}
