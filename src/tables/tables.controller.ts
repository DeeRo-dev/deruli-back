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
  UploadedFile as UploadedFileParam,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { UploadImage } from '../storage/image-upload.decorator';
import type { UploadedFile } from '../storage/storage.service';
import { CreateTableDto } from './dto/create-table.dto';
import { JoinTableDto } from './dto/join-table.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
// import type: con emitDecoratorMetadata, un tipo usado en una firma
// decorada no puede importarse como valor.
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTableDto) {
    return this.tablesService.create(user.id, dto);
  }

  /** Va antes de :id para que "join" no se lea como un id. */
  @Post('join')
  @HttpCode(HttpStatus.OK)
  join(@CurrentUser() user: AuthenticatedUser, @Body() dto: JoinTableDto) {
    return this.tablesService.joinByInviteCode(dto.code, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.tablesService.findAllForUser(user.id);
  }

  /** Foto de la mesa: la puede cambiar cualquier miembro. */
  @Post(':id/image')
  @HttpCode(HttpStatus.OK)
  @UploadImage()
  setPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFileParam() file: UploadedFile | undefined,
  ) {
    return this.tablesService.setPhoto(id, user.id, file);
  }

  @Delete(':id/image')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tablesService.removePhoto(id, user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tablesService.findOneForUser(id, user.id);
  }
}
