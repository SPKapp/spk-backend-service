# Konfiguracja

Wymagana zmienna środowiskowa: `NODE_ENV` - jedno z [`production`, `development`, `test`]

Reszta zmiennych może być w plikach:

- `.env/$NODE_ENV.env`
- `.env/local.$NODE_ENV.env`

### Common:

Patrz [common.config.ts](src/config/common.config.ts)

- `APP_NAME` - nazwa aplikacji
- `DISABLE_PUSH_NOTIFICATIONS` - deweloperskie, jeśli `true` to nie wysyła pushów
- `ADD_MANAGER_TO_NOTIFICATION_DELAY` - czas w dniach po którym dodaje się managera do powiadomień, domyślnie 7 dni
- `ADD_EMAIL_TO_NOTIFICATION_DELAY` - czas w dniach po którym dodaje się email do powiadomień, domyślnie 14 dni

### Database:

Patrz [database.config.ts](src/config/database.config.ts)

- `DATABASE_HOST` - Wymagane
- `DATABASE_PORT` - Wymagane
- `DATABASE_USERNAME` - Wymagane
- `DATABASE_PASSWORD` - Wymagane
- `DATABASE_NAME` - Wymagane
- `DATABASE_SSL` - jeśli `true` połaczenie szyfrowane, wpp. brak ssl
- `DATABASE_SSL_CA` - używane jeśli `DATABASE_SSL = true`, certyfikat CA bazy lub niezdefioniowane
- `DATABASE_LOGGING` - używane gdy `NODE_ENV=development` - uruchamia logowanie zapytań

### Email

Patrz [email.config.ts](src/config/email.config.ts)

- `EMAIL_HOST` - Wymagane
- `EMAIL_USER` - Wymagane
- `EMAIL_PASS` - Wymagane
- `EMAIL_FROM` - Wymagane

### Firebase

Patrz [firebase.config.ts](src/config/firebase.config.ts)

- `GOOGLE_APPLICATION_CREDENTIALS` - plik konfiguracyjny firebase
- `FIREBASE_SERVICE_ACCOUNT` - zmienna zawierająca zawatość pliku konfiguracyjnego firebase
- `FIREBASE_EMULATORS_PROJECT_ID` - deweloperskie, nazwa projektID
- `FIREBASE_AUTH_EMULATOR_HOST` -deweloperskie, host emulatora firebase auth
