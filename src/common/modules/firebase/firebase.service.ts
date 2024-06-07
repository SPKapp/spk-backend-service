import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  applicationDefault,
  initializeApp,
  cert,
  Credential,
} from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Messaging, getMessaging } from 'firebase-admin/messaging';
import { Storage, getStorage } from 'firebase-admin/storage';

import { FirebaseConfig } from '../../../config';

@Injectable()
export class FirebaseService {
  readonly credential: Credential;
  readonly auth: Auth;
  readonly messaging: Messaging;
  readonly storage: Storage;

  constructor(
    @Inject(FirebaseConfig.KEY)
    private readonly config: ConfigType<typeof FirebaseConfig>,
  ) {
    const app = initializeApp({
      credential: this.config.serviceAccount
        ? cert(this.config.serviceAccount)
        : applicationDefault(),
      projectId: this.config.emulatorsProjectId,
    });

    this.credential = app.options.credential;
    this.auth = getAuth();
    this.messaging = getMessaging();
    this.storage = getStorage();
  }
}

export { TokenMessage } from 'firebase-admin/lib/messaging/messaging-api';
