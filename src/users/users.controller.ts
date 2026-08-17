import {
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
import { UsersService } from './users.service';
import { UserStatsService } from './user-stats.service';
import { UploadImage } from '../storage/image-upload.decorator';
import type { UploadedFile } from '../storage/storage.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
// import type: con emitDecoratorMetadata, un tipo usado en una firma
// decorada no puede importarse como valor.
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userStatsService: UserStatsService,
  ) {}

  /** Va antes de :id para que "me" no se lea como un id. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Get('me/stats')
  myStats(@CurrentUser() user: AuthenticatedUser) {
    return this.userStatsService.getStats(user.id);
  }

  /**
   * Foto de perfil. Solo sobre uno mismo: no hay ruta para cambiarle el
   * avatar a otro usuario, así que el permiso es el propio token.
   */
  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UploadImage()
  setAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFileParam() file: UploadedFile | undefined,
  ) {
    return this.usersService.setAvatar(user.id, file);
  }

  @Delete('me/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.removeAvatar(user.id);
  }

  @Get()
  getUsers() {
    return this.usersService.findAll();
  }

  @Get(':id/stats')
  statsFor(@Param('id', ParseIntPipe) id: number) {
    return this.userStatsService.getStats(id);
  }
}
