# Jak uruchomić aplikację w trybie deweloperskim

1. Uruchom bazę danych za pomocą dockera:

   ```
   cd development/
   docker compose up -d
   ```

2. Dodaj brakujące zmienne środowsikowe

- Utwórz plik `.env/local.development.env` z [Konfiguracją Mailera](env.md#Email)
  - używam własnego mailserwera \
    (być może warto dodać środowisko deweloperskie do tego - mailer pozwala na wyświetlanie maila w przeglądarce zamiast wysyłania)

3. Uruchom emulator firebase

- VSCode: `Start Emulators` w zakładce `Run & Debug`
- Terminal: `npm run firebase:emulator`

4. Uruchom aplikację

- VSCode: `Run` w zakładce `Run & Debug`
- Terminal: `npm run start:dev`, gdy ustawiona jest zmienna środowiskowa `NODE_ENV=development`
