import { Test, TestingModule } from '@nestjs/testing';
import { BitetribeController } from './bitetribe.controller';
import { BitetribeService } from './bitetribe.service';

describe('BitetribeController', () => {
  let controller: BitetribeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BitetribeController],
      providers: [BitetribeService],
    }).compile();

    controller = module.get<BitetribeController>(BitetribeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
