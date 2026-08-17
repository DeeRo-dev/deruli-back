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
  Put,
  UploadedFile as UploadedFileParam,
} from '@nestjs/common';
import { MealsService } from './meals.service';
import { UploadImage } from '../storage/image-upload.decorator';
import type { UploadedFile } from '../storage/storage.service';
import { CreateMealDto, RateMealDto } from './dto/meal.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('outings/:outingId/meals')
export class OutingMealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('outingId', ParseIntPipe) outingId: number,
    @Body() dto: CreateMealDto,
  ) {
    return this.mealsService.create(outingId, user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('outingId', ParseIntPipe) outingId: number,
  ) {
    return this.mealsService.findAllForOuting(outingId, user.id);
  }
}

@Controller('meals/:mealId/rating')
export class MealRatingController {
  constructor(private readonly mealsService: MealsService) {}

  /** PUT y no POST: puntuar de nuevo pisa tu puntaje anterior. */
  @Put()
  @HttpCode(HttpStatus.OK)
  rate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mealId', ParseIntPipe) mealId: number,
    @Body() dto: RateMealDto,
  ) {
    return this.mealsService.rate(mealId, user.id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mealId', ParseIntPipe) mealId: number,
  ) {
    return this.mealsService.removeRating(mealId, user.id);
  }

  /* Las fotos de la reseña cuelgan de la puntuación, no del plato: cada
     comensal tiene la suya del mismo plato. */

  @Get('images')
  listImages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mealId', ParseIntPipe) mealId: number,
  ) {
    return this.mealsService.listRatingImages(mealId, user.id);
  }

  @Post('images')
  @HttpCode(HttpStatus.CREATED)
  @UploadImage()
  addImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mealId', ParseIntPipe) mealId: number,
    @UploadedFileParam() file: UploadedFile | undefined,
  ) {
    return this.mealsService.addRatingImage(mealId, user.id, file);
  }

  @Delete('images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mealId', ParseIntPipe) mealId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.mealsService.removeRatingImage(mealId, user.id, imageId);
  }
}
