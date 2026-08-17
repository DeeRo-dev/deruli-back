/**
 * Registro de tipos de recurso que pueden tener imágenes.
 *
 * Agregar una feature nueva con imágenes es sumar una entrada acá: el path,
 * la validación y el borrado ya funcionan para todos por igual. No hay
 * código por recurso en el sistema de storage.
 *
 *   IMAGE_RESOURCES = { ..., events: { prefix: 'events' } }
 *   → events/{eventId}/{uuid}.webp
 */
export const IMAGE_RESOURCES = {
  /** Avatar del usuario. Uno solo por usuario. */
  avatars: { prefix: 'avatars', multiple: false },
  /** Foto principal + galería del lugar. */
  places: { prefix: 'places', multiple: true },
  /**
   * Fotos de una reseña. En esta base la reseña es `meal_ratings`: lo que
   * puntuó y escribió una persona sobre un plato concreto. Por eso el id
   * que va en el path es el de la puntuación, no el del plato.
   */
  reviews: { prefix: 'reviews', multiple: true },
  /** Foto de la mesa. Una sola. */
  tables: { prefix: 'tables', multiple: false },
} as const;

export type ImageResource = keyof typeof IMAGE_RESOURCES;

export function isImageResource(value: string): value is ImageResource {
  return Object.hasOwn(IMAGE_RESOURCES, value);
}
