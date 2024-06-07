import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { userNoRoles } from '../../common/tests';
import { StorageConfig } from '../../config';
import { RabbitPhotosAccessType } from '../../rabbits';
import { RabbitPhotosService } from './rabbit-photos.service';

describe(RabbitPhotosService, () => {
  let service: RabbitPhotosService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitPhotosService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: StorageConfig.KEY,
          useValue: {
            tokenValidTime: 900,
          },
        },
      ],
    }).compile();

    service = module.get<RabbitPhotosService>(RabbitPhotosService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    const currentTime = new Date(2024, 4, 1);

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(currentTime);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should be defined', () => {
      expect(service.generateToken).toBeDefined();
    });

    it('should generate token with access type Full', async () => {
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await expect(
        service.generateToken(1, userNoRoles, RabbitPhotosAccessType.Full),
      ).resolves.toEqual('token');

      expect(jwtService.sign).toHaveBeenCalledWith({
        uid: userNoRoles.id,
        claims: {
          expiresAt: currentTime.valueOf() + 900 * 1000,
          rabbit: {
            id: '1',
            photos: true,
          },
        },
      });
    });

    it('should generate token with access type Own', async () => {
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await expect(
        service.generateToken(1, userNoRoles, RabbitPhotosAccessType.Own),
      ).resolves.toEqual('token');

      expect(jwtService.sign).toHaveBeenCalledWith({
        uid: userNoRoles.id,
        claims: {
          expiresAt: currentTime.valueOf() + 900 * 1000,
          rabbit: {
            id: '1',
            photos: 'own',
          },
        },
      });
    });

    it('should throw ForbiddenException when access type is Deny', async () => {
      await expect(
        service.generateToken(1, userNoRoles, RabbitPhotosAccessType.Deny),
      ).rejects.toThrow(
        new InternalServerErrorException('Invalid token access type.'),
      );
    });
  });
});
