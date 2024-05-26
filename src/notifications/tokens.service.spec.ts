import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { NotificationConfig } from '../config';
import { TokensService } from './tokens.service';
import { FcmToken } from './entities';
import { User } from '../users/entities';

describe(TokensService, () => {
  let service: TokensService;
  let tokenRepository: Repository<FcmToken>;

  const mockedDate = new Date(2024, 4, 1);
  const token = new FcmToken({
    id: 1,
    user: new User({ id: 1 }),
    token: 'token',
    updatedAt: new Date(2024, 0, 1),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: NotificationConfig.KEY,
          useValue: {
            cutOffDays: 30,
          },
        },
        {
          provide: getRepositoryToken(FcmToken),
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    tokenRepository = module.get<Repository<FcmToken>>(
      getRepositoryToken(FcmToken),
    );

    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update an existing token', async () => {
      jest.spyOn(tokenRepository, 'findOneBy').mockResolvedValue(token);

      await service.update(token.user.id, token.token);

      expect(tokenRepository.save).toHaveBeenCalledWith({
        ...token,
        updatedAt: mockedDate,
      });
    });

    it('should create a new token', async () => {
      jest.spyOn(tokenRepository, 'findOneBy').mockResolvedValue(null);

      await service.update(token.user.id, token.token);

      expect(tokenRepository.save).toHaveBeenCalledWith({
        token: token.token,
        user: { id: token.user.id },
        updatedAt: mockedDate,
      });
    });
  });

  describe('delete', () => {
    it('should delete a token', async () => {
      await service.delete(token.user.id, token.token);

      expect(tokenRepository.delete).toHaveBeenCalledWith({
        user: { id: token.user.id },
        token: token.token,
      });
    });
  });

  describe('removeOldTokens', () => {
    it('should remove old tokens', async () => {
      jest
        .spyOn(tokenRepository, 'delete')
        .mockResolvedValue({ affected: 1 } as any);

      await service.removeOldTokens();

      expect(tokenRepository.delete).toHaveBeenCalledWith({
        updatedAt: LessThan(new Date(2024, 3, 1)),
      });
    });
  });
});
