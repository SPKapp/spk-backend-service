# Konfiguracja

Wymagana zmienna środowiskowa: `NODE_ENV` - jedno z [`production`, `development`, `test`]

Reszta zmiennych może być w plikach:

- `.env/$NODE_ENV.env`
- `.env/local.$NODE_ENV.env`

### Common:

Patrz [common.config.ts](src/config/common.config.ts)

- `APP_NAME` - nazwa aplikacji

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

### Notifications

Patrz [notifications.config.ts](src/config/notifications.config.ts)

- `NOTIFICATION_REMOVE_TOKEN_DAYS` - czas po którym usuwa tokeny push, domyślnie 40 dni
- `NOTIFICATION_DISABLE_PUSH` - deweloperskie, jeśli `true` to nie wysyła pushów
- `NOTIFICATION_ADD_MANAGER_DELAY` - czas w dniach po którym dodaje się managera do powiadomień, domyślnie 7 dni
- `NOTIFICATION_ADD_EMAIL_DELAY` - czas w dniach po którym dodaje się email do powiadomień, domyślnie 14 dni
- `NOTIFICATION_WEB_LINK` - link do aplikacji webowej
- `NOTIFICATION_ICON_LINK` - link do ikony powiadomień

### Cron

Patrz [cron.config.ts](src/config/cron.config.ts)

- `CRON_CHECK_ADMISSION_STATE` - wyrażenie cron dla sprawdzania stanu przyjęć (domyślnie `0 19 * * *`)
- `CRON_CHECK_ADOPTION_STATE` - wyrażenie cron dla sprawdzania stanu adopcji (domyślnie `0 20 * * *`)
- `CRON_REMOVE_OLD_FCM_TOKENS` - wyrażenie cron dla usuwania starych tokenów push (domyślnie `0 01 * * *`)
- `CRON_NOTIFY_ABOUT_VET_VISIT` - wyrażenie cron dla powiadomień o wizycie u weterynarza (domyślnie `30 19 * * *`)
- `CRON_NOTIFY_ABOUT_VET_VISIT_DAYS_BEFORE` - liczba dni przed wizytą u weterynarza, kiedy wysłać powiadomienie (domyślnie 3)
- `CRON_NOTIFY_ABOUT_ENDED_VET_VISIT` - wyrażenie cron dla powiadomień o zakończonej wizycie u weterynarza (domyślnie `30 20 * * *`)
