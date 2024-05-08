# Jak utworzono środowisko testowe

## Firebase

1. Utworzenie projektu
2. Aktywowanie modułu Autentykacji i aktywacja logowania hasłem
3. Pobranie klucza serwisowego
   `Project settings -> Service accounts -> Generate new private key`

## DigitalOcean

### Utworzenie Bazy danych

- Dodanie dodatkowego usera i bazy

## Utworzenie AppPlatform

- Dodanie zmiennych środowiskowych
- Uruchomienie skryptów inicjalizacyjnych - na czas `npm run typeorm:sync` użytkownik bazy potrzebował uprawnień: `GRANT CREATE ON SCHEMA public TO user;`, potem je zabrano: `REVOKE CREATE ON SCHEMA public FROM user;`
