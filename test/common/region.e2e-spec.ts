import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource, Repository } from 'typeorm';

import { Region } from '../../src/common/modules/region/entities/region.entity';
import { FirebaseAuthGuard } from '../../src/common/modules/auth/firebase-auth/firebase-auth.guard';

describe('Region tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let regionRepository: Repository<Region>;

  const regions: Region[] = [
    {
      id: 1,
      name: 'Region 1',
    },
    {
      id: 2,
      name: 'Region 2',
    },
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    regionRepository = dataSource.getRepository(Region);
  });

  it('should return list of regions', async () => {
    await regionRepository.save(regions);

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{ regions { id name } }`,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.regions).toEqual(regions);
      });
  });
});

// TODO: Add more tests
