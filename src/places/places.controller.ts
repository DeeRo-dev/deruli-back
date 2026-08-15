import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlaceReviewsService } from './place-reviews.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { SearchPlacesDto } from './dto/search-places.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
// import type: con emitDecoratorMetadata, un tipo usado en una firma
// decorada no puede importarse como valor.
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('places')
export class PlacesController {
  constructor(
    private readonly placesService: PlacesService,
    private readonly placeReviewsService: PlaceReviewsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlaceDto) {
    return this.placesService.create(user.id, dto);
  }

  /** Paginado y ordenable: sort=top trae los mejor puntuados. */
  @Get()
  search(@Query() query: SearchPlacesDto) {
    return this.placesService.search(query);
  }

  /** Las mesas que lo visitaron, qué puntuó cada comensal y el global. */
  @Get(':id/reviews')
  findReviews(@Param('id', ParseIntPipe) id: number) {
    return this.placeReviewsService.getPlaceReviews(id);
  }

  /** Incluye el promedio global de derulis y la cantidad de visitas. */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.placeReviewsService.getPlaceDetail(id);
  }
}
