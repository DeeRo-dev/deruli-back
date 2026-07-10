import { Injectable } from '@nestjs/common';
import { CreateBitetribeDto } from './dto/create-bitetribe.dto';
import { UpdateBitetribeDto } from './dto/update-bitetribe.dto';

@Injectable()
export class BitetribeService {
  create(createBitetribeDto: CreateBitetribeDto) {
    
    return 'This action adds a new bitetribe';
  }

  findAll() {
    return `This action returns all bitetribe`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bitetribe`;
  }

  update(id: number, updateBitetribeDto: UpdateBitetribeDto) {
    return `This action updates a #${id} bitetribe`;
  }

  remove(id: number) {
    return `This action removes a #${id} bitetribe`;
  }
}
