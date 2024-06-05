# Zdjęcia królików

Każdy **_królik_** posiada folder z plikami zdjęć w [Firebase Storage](firebase.md#storage).

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
- `rabbit` - obiekt z polami:
  - `id` - ID królika
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

TODO: jak oznaczyć zdjęcie jako główne
