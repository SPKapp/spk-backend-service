import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  auth: admin.auth.Auth;
  constructor(@Inject('FIREBASE_APP') private firebaseApp: admin.app.App) {
    this.auth = firebaseApp.auth();
  }
}
