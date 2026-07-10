import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BitetribeService } from './bitetribe.service';
import { CreateBitetribeDto } from './dto/create-bitetribe.dto';
import { UpdateBitetribeDto } from './dto/update-bitetribe.dto';

@Controller('bitetribe')
export class BitetribeController {
  constructor(private readonly bitetribeService: BitetribeService) {}

  @Post()
  create(@Body() createBitetribeDto: CreateBitetribeDto) {
    return this.bitetribeService.create(createBitetribeDto);
  }

  @Get()
  findAll() {
    return this.bitetribeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bitetribeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBitetribeDto: UpdateBitetribeDto) {
    return this.bitetribeService.update(+id, updateBitetribeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bitetribeService.remove(+id);
  }
}
