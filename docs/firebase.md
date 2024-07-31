# Firebase

## Wgrywanie ustawień

1. Instalacja narzędzia `firebase-tools`:\
   `sudo npm install -g firebase-tools`
2. Zalogowanie do Firebase:\
   `firebase login`
3. Wybór projektu:\
   `firebase use --alias [alias zdefiniowany w pliku .firebaserc]`
4. Wgrywanie ustawień:\
   `firebase deploy`

## Storage

### Token

Każdy token powinien zawierać:

- `uid` - ID użytkownika
- `claims` - obiekt z polami:
  - `expiresAt` - data ważności tokenu w formacie liczby milisekund od 1 stycznia 1970

### Dostęp

Dostęp do plików odbywa się poprzez specjalnie wygenerowany token. Token jest generowany na podstawie ID użytkownika, który chce uzyskać dostęp do plików oraz jego uprawnień do wskazanego zasobu.

Każdy zasób definiuje własne pola uprawnień, które powinny być ustawione w tokenie, aby uzyskać dostęp do zasobu.

### Struktura danych

- `/rabbits/{rabbitId}` - dane królika
  - `photos/{photoName}` - Szczegółowy opis: [Zdjęcia królików](rabbit-photos.md)

## Tworzenie Środowiska

1. Utworzenie projektu:
   - [Firebase Console](https://console.firebase.google.com/)
   - `Add project`
   - Wyłączenie Google Analytics
2. Aktywacja modułu Autentykacji:

   - Authentication -> Get started
   - Sign-in method -> Email/Password -> Enable
   - Sign-in method -> Google -> Enable
   - Settings -> User actions -> Disable create and delete accounts
   - Settings -> Authorized domains -> Add domain
   - Templates -> SMTP settings -> Enable and configure

3. Aktywacja modułu Storage:

   - Storage -> Get started
   - Start in production mode
   - Wybierz `europe-central2`(Warszawa) jako region

4. Pobranie klucza serwisowego:
   - Project settings -> Service accounts -> Generate new private key
   - Plik z kluczem umieścić w pliku zdefiniowanym w zmiennej środowiskowej `GOOGLE_APPLICATION_CREDENTIALS` (patrz [env](env.md#firebase))
     lub w zmiennej środowiskowej `FIREBASE_SERVICE_ACCOUNT` (patrz [env](env.md#firebase))
5. Dodanie aliasu do projektu:\
   `firebase use --add`
6. Wgrywanie ustawień:\
   `firebase deploy -P <nazwa_projektu>`
