import { Test, TestingModule } from '@nestjs/testing';

import { TokensResolver } from './tokens.resolver';
import { TokensService } from './tokens.service';
import { userNoRoles } from '../common/tests';
import { FirebaseAuthGuard } from '../common/modules/auth';

describe(TokensResolver, () => {
  let resolver: TokensResolver;
  let tokenService: TokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensResolver,
        {
          provide: TokensService,
          useValue: {
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<TokensResolver>(TokensResolver);
    tokenService = module.get<TokensService>(TokensService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('updateToken', () => {
    it('should call the service with the provided token', async () => {
      const token = 'token';

      await expect(resolver.updateFcmToken(userNoRoles, token)).resolves.toBe(
        true,
      );

      expect(tokenService.update).toHaveBeenCalledWith(userNoRoles.id, token);
    });
  });

  describe('deleteToken', () => {
    it('should call the service with the provided token', async () => {
      const token = 'token';

      await expect(resolver.deleteFcmToken(userNoRoles, token)).resolves.toBe(
        true,
      );

      expect(tokenService.delete).toHaveBeenCalledWith(userNoRoles.id, token);
    });
  });
});
