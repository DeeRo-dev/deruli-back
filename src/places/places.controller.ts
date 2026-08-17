import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile as UploadedFileParam,
} from '@nestjs/common';
import { UploadImage } from '../storage/image-upload.decorator';
import type { UploadedFile } from '../storage/storage.service';
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

  /** Galería del lugar. Como toda la ficha, la ve cualquier usuario logueado. */
  @Get(':id/images')
  listImages(@Param('id', ParseIntPipe) id: number) {
    return this.placesService.listImages(id);
  }

  /** Solo quien visitó el lugar puede sumar fotos. */
  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  @UploadImage()
  addImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFileParam() file: UploadedFile | undefined,
  ) {
    return this.placesService.addImage(id, user.id, file);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.placesService.removeImage(id, imageId, user.id);
  }

  /**
   * Completa las coordenadas del lugar geocodificando su dirección, para
   * los lugares cargados sin marcar el punto en el mapa. Idempotente.
   */
  @Post(':id/locate')
  @HttpCode(HttpStatus.OK)
  locate(@Param('id', ParseIntPipe) id: number) {
    return this.placesService.locate(id);
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
