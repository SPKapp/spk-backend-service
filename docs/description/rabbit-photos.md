# Zdjęcia królików

Każdy **_królik_** posiada folder z plikami zdjęć w [Firebase Storage](../firebase.md#storage).

## Ścieżka

`/rabbits/{rabbitId}/photos/{photoName}`

## Dostęp

### Uprawnienia dostępu

- `read` - tak jak `read` dla królika
- `create` - tak jak `read` dla królika
- `update` - **_Admin_**, **_RegionManager_**, **_RegionOwner_**
  - **_Volounteer_** może edytować tylko zdjęcia, które sam dodał
- `delete` - **_Admin_**, **_RegionManager_**, **_RegionOwner_**
  - **_Volounteer_** może usuwać tylko zdjęcia, które sam dodał

### Token

- `uid` - ID użytkownika
- `claims` - obiekt z polami:
  - `expiresAt` - data ważności tokenu
  - `rabbit` - obiekt z polami:
    - `id` - ID królika - string
    - `photos` - jedno z: `true`, `'read'`
      - `true` - pełna możliwość zarządzania zdjęciami (**_Admin_**, **_RegionManager_**, **_RegionOwner_**)
      - `'own'` - możliwość zarządzania tylko swoimi zdjęciami (**_Volounteer_**)

Przykład:

```json
{
  "uid": "userId",
  "rabbit": {
    "id": "rabbitId",
    "photos": "own"
  }
}
```

## Metadane

- `uploadedBy` - ID użytkownika, który dodał zdjęcie, powinno być zgodne z `uid` w tokenie

## Zdjęcie główne

plik `/rabbits/{rabbitId}/photos/default` zawiera nazwę zdjęcia, które jest ustawione jako główne

## Implementacja

- reguły dostępu: [storage.rules](/firebase/storage.rules)
- moduł przydzielania tokenów: [StorageAccessModule](/src/storage-access/storage-access.module.ts)
  - [RabbitPhotosService](/src/storage-access/rabbit/rabbit-photos.service.ts) - przydzielanie tokenów
  - [RabbitPhotosResolver](/src/storage-access/rabbit/rabbit-photos.resolver.ts) - obsługa zapytań GraphQL
- funkcja przyznająca dostęp: [grantPhotoAccess](/src/rabbits/rabbits-access.service.ts)
