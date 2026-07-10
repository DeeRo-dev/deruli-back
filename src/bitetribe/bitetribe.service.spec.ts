import { Test, TestingModule } from '@nestjs/testing';
import { BitetribeService } from './bitetribe.service';

describe('BitetribeService', () => {
  let service: BitetribeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BitetribeService],
    }).compile();

    service = module.get<BitetribeService>(BitetribeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
