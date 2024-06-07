import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { FirebaseAuthGuard } from '../../common/modules/auth';
import { userVolunteer } from '../../common/tests';

import { RabbitPhotosResolver } from './rabbit-photos.resolver';
import { RabbitPhotosService } from './rabbit-photos.service';
import { RabbitPhotosAccessType, RabbitsAccessService } from '../../rabbits';

describe(RabbitPhotosResolver, () => {
  let resolver: RabbitPhotosResolver;
  let rabbitPhotosService: RabbitPhotosService;
  let rabbitsAccessService: RabbitsAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitPhotosResolver,
        {
          provide: RabbitPhotosService,
          useValue: {
            generateToken: jest.fn(),
          },
        },
        {
          provide: RabbitsAccessService,
          useValue: {
            grantPhotoAccess: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<RabbitPhotosResolver>(RabbitPhotosResolver);
    rabbitPhotosService = module.get<RabbitPhotosService>(RabbitPhotosService);
    rabbitsAccessService =
      module.get<RabbitsAccessService>(RabbitsAccessService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getToken', () => {
    it('should be defined', () => {
      expect(resolver.getToken).toBeDefined();
    });

    it('should deny access', async () => {
      jest
        .spyOn(rabbitsAccessService, 'grantPhotoAccess')
        .mockResolvedValueOnce(RabbitPhotosAccessType.Deny);

      await expect(resolver.getToken(userVolunteer, '1')).rejects.toThrow(
        new ForbiddenException(),
      );
    });

    it('should grant full access', async () => {
      jest
        .spyOn(rabbitsAccessService, 'grantPhotoAccess')
        .mockResolvedValueOnce(RabbitPhotosAccessType.Full);
      jest
        .spyOn(rabbitPhotosService, 'generateToken')
        .mockResolvedValueOnce('token');

      await expect(resolver.getToken(userVolunteer, '1')).resolves.toEqual({
        token: 'token',
      });

      expect(rabbitPhotosService.generateToken).toHaveBeenCalledWith(
        1,
        userVolunteer,
        RabbitPhotosAccessType.Full,
      );
    });

    it('should grant limited access', async () => {
      jest
        .spyOn(rabbitsAccessService, 'grantPhotoAccess')
        .mockResolvedValueOnce(RabbitPhotosAccessType.Own);
      jest
        .spyOn(rabbitPhotosService, 'generateToken')
        .mockResolvedValueOnce('token');

      await expect(resolver.getToken(userVolunteer, '1')).resolves.toEqual({
        token: 'token',
      });

      expect(rabbitPhotosService.generateToken).toHaveBeenCalledWith(
        1,
        userVolunteer,
        RabbitPhotosAccessType.Own,
      );
    });
  });
});
