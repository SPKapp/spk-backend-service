# Region

Jednostka administracyjna, w jej ramach dzieją się wszystkie procesy aplikacji.

Każdy obiekt powinien być przypisany do jednego z regionów.

Użytkownik może mieć przypisane uprawnienia do wielu regionów, ale zawsze jest przypisany do jednego regionu jako domyślnego.

Domyślnie tworzony jest jeden region o nazwie "Administrators", do którego przypisany jest pierwszy użytkownik. (Patrz: [Skrypt inicjalizacyjny](/scripts/create-admin.script.ts))

## Atrybuty

- `name` - nazwa regionu, unikalna w ramach systemu

## Zarządzanie

Uprawnienia do zarządzania regionami jedynie użytkownicy z rolą `Admin`.
