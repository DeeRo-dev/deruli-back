import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { OutingsService } from './outings.service';
import { CreateOutingDto } from './dto/create-outing.dto';
import { UpdateOutingDto } from './dto/update-outing.dto';
import { RateOutingDto } from './dto/rate-outing.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import type { OutingStatus } from './outing.entity';

/** Las salidas cuelgan de una mesa: se crean y listan desde ahí. */
@Controller('tables/:tableId/outings')
export class TableOutingsController {
  constructor(private readonly outingsService: OutingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Body() dto: CreateOutingDto,
  ) {
    return this.outingsService.create(tableId, user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Query('status') status?: OutingStatus,
  ) {
    return this.outingsService.findAllForTable(tableId, user.id, status);
  }
}

@Controller('outings')
export class OutingsController {
  constructor(private readonly outingsService: OutingsService) {}

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.outingsService.findOneForUser(id, user.id);
  }

  /** Sumarse a la salida: es opt-in, no te anota nadie por vos. */
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.outingsService.join(id, user.id);
  }

  @Delete(':id/join')
  @HttpCode(HttpStatus.OK)
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.outingsService.leave(id, user.id);
  }

  /** Puntúa el lugar y la atención. PUT: volver a puntuar pisa lo anterior. */
  @Put(':id/rating')
  @HttpCode(HttpStatus.OK)
  rate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateOutingDto,
  ) {
    return this.outingsService.rate(id, user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOutingDto,
  ) {
    return this.outingsService.update(id, user.id, dto);
  }
}
