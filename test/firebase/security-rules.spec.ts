import { readFileSync } from 'fs';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  FirebaseStorage,
  deleteObject,
  getDownloadURL,
  getMetadata,
  list,
  listAll,
  ref,
  uploadString,
} from 'firebase/storage';

describe('Firebase Storage Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  afterAll(async () => await testEnv.cleanup());

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-spkdev',
      storage: {
        rules: readFileSync('firebase/storage.rules', 'utf8'),
        host: 'localhost',
        port: 3052,
      },
    });
  });

  beforeEach(async () => await testEnv.clearStorage());

  describe('Rabbit Photos', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .storage()
          .ref('rabbits/1/photos/1.jpg')
          .putString('data', undefined, {
            customMetadata: {
              uploadedBy: 'test user',
            },
          });
      });
    });

    describe('No Access to Rabbit', () => {
      it('should deny read and write access to unauthenticated users', async () => {
        const unauthenticated = testEnv.unauthenticatedContext();
        const photo = ref(unauthenticated.storage(), 'rabbits/1/photos/1.jpg');
        await assertFails(getDownloadURL(photo));

        const photo2 = ref(unauthenticated.storage(), 'rabbits/1/photos/2.jpg');
        await assertFails(uploadString(photo2, 'data'));
      });

      it('should deny read and create access to authenticated users', async () => {
        const authenticated = testEnv.authenticatedContext('user');
        const photo = ref(authenticated.storage(), 'rabbits/1/photos/1.jpg');
        await assertFails(getDownloadURL(photo));

        const photo2 = ref(authenticated.storage(), 'rabbits/1/photos/2.jpg');
        await assertFails(uploadString(photo2, 'data'));
      });
    });

    describe('Correct Token - full', () => {
      let authenticated: FirebaseStorage;

      beforeAll(async () => {
        authenticated = testEnv
          .authenticatedContext('user', {
            rabbit: {
              id: '1',
              photos: true,
            },
          })
          .storage();
      });

      it('should allow read access', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/1.jpg');
        await assertSucceeds(getDownloadURL(photo));
      });

      it('should allow create access', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/2.jpg');
        await assertSucceeds(
          uploadString(photo, 'data', undefined, {
            customMetadata: {
              uploadedBy: 'user',
            },
          }),
        );
      });

      it('should deny create access - without `uploadedBy` metadata', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/3.jpg');
        await assertFails(uploadString(photo, 'data'));
      });

      it('should deny create access - wrong `uploadedBy` metadata', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/4.jpg');
        await assertFails(
          uploadString(photo, 'data', undefined, {
            customMetadata: {
              uploadedBy: 'test',
            },
          }),
        );
      });

      it('should allow delete access', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/1.jpg');
        await assertSucceeds(deleteObject(photo));
      });

      it('should allow list access - photos folder', async () => {
        const rabbit = ref(authenticated, 'rabbits/1/photos/1');
        await assertSucceeds(list(rabbit));
      });

      it('should deny list access - rabbit folder', async () => {
        const rabbit = ref(authenticated, 'rabbits/1/');
        await assertFails(listAll(rabbit));
      });
    });

    describe('Correct Token - own', () => {
      let authenticated: FirebaseStorage;

      beforeAll(async () => {
        authenticated = testEnv
          .authenticatedContext('user', {
            rabbit: {
              id: '1',
              photos: 'own',
            },
          })
          .storage();
      });

      it('should allow read access', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/1.jpg');
        await assertSucceeds(getDownloadURL(photo));
      });

      it('should allow create access', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/2.jpg');
        await assertSucceeds(
          uploadString(photo, 'data', undefined, {
            customMetadata: {
              uploadedBy: 'user',
            },
          }),
        );
      });

      it('should allow delete access - own', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/10.jpg');

        await assertSucceeds(
          uploadString(photo, 'data', undefined, {
            customMetadata: {
              uploadedBy: 'user',
            },
          }),
        );
        const metadata = await getMetadata(photo);
        console.log('metadata', metadata);
        await assertSucceeds(deleteObject(photo));
      });

      it('should deny delete access - other', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/1.jpg');
        await assertFails(deleteObject(photo));
      });

      it('should allow list access - photos folder', async () => {
        const rabbit = ref(authenticated, 'rabbits/1/photos/1');
        await assertSucceeds(list(rabbit));
      });

      it('should deny list access - rabbit folder', async () => {
        const rabbit = ref(authenticated, 'rabbits/1/');
        await assertFails(listAll(rabbit));
      });
    });

    describe('Incorrect Token - no photos', () => {
      let authenticated: FirebaseStorage;

      beforeAll(async () => {
        authenticated = testEnv
          .authenticatedContext('user', {
            rabbit: {
              id: '1',
            },
          })
          .storage();
      });

      it('should deny read access', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/1.jpg');
        await assertFails(getDownloadURL(photo));
      });

      it('should deny write access', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/2.jpg');
        await assertFails(
          uploadString(photo, 'data', undefined, {
            customMetadata: { uploadedBy: 'user' },
          }),
        );
      });

      it('should deny list access - photos folder', async () => {
        const rabbit = ref(authenticated, 'rabbits/1/photos/1');
        await assertFails(list(rabbit));
      });
    });

    describe('Incorrect Token - wrong rabbit', () => {
      let authenticated: FirebaseStorage;

      beforeAll(async () => {
        authenticated = testEnv
          .authenticatedContext('user', {
            rabbit: {
              id: '20',
              photos: true,
            },
          })
          .storage();
      });

      it('should deny read access', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/1.jpg');
        await assertFails(getDownloadURL(photo));
      });

      it('should deny write access', async () => {
        const photo = ref(authenticated, 'rabbits/1/photos/2.jpg');
        await assertFails(
          uploadString(photo, 'data', undefined, {
            customMetadata: { uploadedBy: 'user' },
          }),
        );
      });

      it('should deny list access - photos folder', async () => {
        const rabbit = ref(authenticated, 'rabbits/1/photos/1');
        await assertFails(list(rabbit));
      });
    });
  });
});
