# Jak utworzono środowisko testowe

## [Firebase](firebase.md#tworzenie-środowiska)

## DigitalOcean

### Utworzenie Bazy danych

- Dodanie dodatkowego usera i bazy

## Utworzenie AppPlatform

- Dodanie zmiennych środowiskowych
- Uruchomienie skryptów inicjalizacyjnych - na czas `npm run typeorm:sync` użytkownik bazy potrzebował uprawnień: `GRANT CREATE ON SCHEMA public TO user;`, potem je zabrano: `REVOKE CREATE ON SCHEMA public FROM user;`
