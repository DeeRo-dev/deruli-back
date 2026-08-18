import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
// import type: con emitDecoratorMetadata, un tipo usado en una firma
// decorada no puede importarse como valor.
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

/** La lista es del usuario, así que cuelga de la sesión, no de un id. */
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.listFor(user.id);
  }

  /** Solo los ids: alcanza para pintar los corazones sin traer las fichas. */
  @Get('ids')
  listIds(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.listPlaceIdsFor(user.id);
  }
}

/**
 * Marcar y desmarcar cuelga del lugar, que es lo que se está mirando.
 *
 * PUT y no POST: guardar dos veces deja el mismo estado, y con PUT eso es
 * lo esperable en vez de una sorpresa.
 */
@Controller('places/:placeId/favorite')
export class PlaceFavoriteController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('placeId', ParseIntPipe) placeId: number,
  ) {
    return this.favoritesService.add(user.id, placeId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('placeId', ParseIntPipe) placeId: number,
  ) {
    return this.favoritesService.remove(user.id, placeId);
  }
}
