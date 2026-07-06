import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers() {
    return this.usersService.findAll();
  }
  @Get('/:id')
  getUser(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }
  @Put('/:id')
  updateUser(@Param('id') id: number, @Body() userData: any) {
    return this.usersService.update(id, userData);
  }
}
