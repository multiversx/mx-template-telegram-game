import { Test, TestingModule } from '@nestjs/testing';
import { MasterWalletService } from './master-wallet.service';

describe('MasterWalletService', () => {
  let service: MasterWalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterWalletService],
    }).compile();

    service = module.get<MasterWalletService>(MasterWalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
