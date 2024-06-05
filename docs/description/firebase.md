# Firebase

## Storage

### Dostęp

Dostęp do plików odbywa się poprzez specjalnie wygenerowany token. Token jest generowany na podstawie ID użytkownika, który chce uzyskać dostęp do plików oraz jego uprawnień do wskazanego zasobu.

Każdy zasób definiuje własne pola uprawnień, które powinny być ustawione w tokenie, aby uzyskać dostęp do zasobu.

### Struktura danych

- `/rabbits/{rabbitId}` - dane królika
  - `photos/{photoName}` - Szczegółowy opis: [Zdjęcia królików](rabbit-photos.md)
