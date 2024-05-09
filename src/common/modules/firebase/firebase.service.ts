import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';

import { FirebaseConfig } from '../../../config';

@Injectable()
export class FirebaseService {
  auth: Auth;

  constructor(
    @Inject(FirebaseConfig.KEY)
    private readonly config: ConfigType<typeof FirebaseConfig>,
  ) {
    initializeApp({
      credential: applicationDefault(),
      projectId: this.config.emulatorsProjectId,
    });

    this.auth = getAuth();
  }
}
