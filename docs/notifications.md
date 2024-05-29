# Powiadomienia

## Opis

Powiadomienia to mechanizm informowania użytkowników o ważnych zdarzeniach w systemie. Powiadomienia mogą być wysyłane w różnych formach, np. email, push.

Wykorzystany do tego celu jest system [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging).

## Struktura powiadomienia

```json
{
  "notification": {
    //opcjonalne
    "title": "Tytuł powiadomienia",
    "body": "Treść powiadomienia"
  },
  "data": {
    "click_action": "FLUTTER_NOTIFICATION_CLICK",
    "category": "Typ powiadomienia (np. 'groupAssigned')"

    // dane specyficzne dla danego typu powiadomienia
  }
}
```

## Typy powiadomień

- email - powiadomienie wysyłane na adres email, najważniejsze powiadomienia
- push - powiadomienie wysyłane na urządzenia mobilne/ przeglądarkę

## Powiadomienia

### Powiadomienie niezdefiniowanego typu

- Kategoria: `undefined`
- Typ: push
- Przypadek użycia: Wysyłka niestandardowego powiadomienia
- UWAGA:
  - Należy zdefiniować `notification.title` i `notification.body`
  - Powiadomienie nie jest usuwane automatycznie
- Do:
  - dowolny użytkownik

### Powiadomienie o przypisaniu **_Grupy Królików_** do **_Wolontariusza_**

- Kategoria: `groupAssigned`
- Typ: email, push
- Przypadek użycia: Przypisanie grupy do wolontariusza
- Do:
  - nowo przypisanego wolontariusza - jednorazowo
- Data:
  - groupId: id grupy

### Powiadomienie o przypisaniu **_Królika_** do grupy przypisanej do **_Wolontariusza_**

- Kategoria: `rabbitAssigned`
- Typ: email, push
- Przypadek użycia: Przypisanie królika do grupy przypisanej do wolontariusza
- Do:
  - wolontariusza przypisanego do królika - jednorazowo
- Data:
  - rabbitId: id królika

### Powiadomienie o przeniesieniu **_Królika_** do innej grupy tego samego **_Wolontariusza_**

- Kategoria: `rabbitMoved`
- Typ: push
- Przypadek użycia: Przeniesienie królika do innej grupy tego samego wolontariusza
- Do:
  - wolontariusza przypisanego do królika - jednorazowo
- Data:
  - rabbitId: id królika

### Powiadomienie o terminie odbioru **_Królika_**

- Kategoria: `admissionToConfirm`
- Typ: push, (email)
- Automatycznie usuwane po zakończeniu zdarzenia
- Przypadek użycia: Gdy minął termin odbioru **_Królika_**, a status królika to **_Incoming_**
- Do:
  - wolontariusza przypisanego do królika - codziennie do czasu poprawienia danych
  - manageraRegionu - codziennie, zaczynając od 4 dnia, do czasu poprawienia danych, po 14 dniach dodatkowo email
- Data:
  - rabbitId: id królika

### Powiadomienie o terminie adopcji **_Grupy Królików_**

- Kategoria: `adoptionToConfirm`
- Typ: push, (email)
- Automatycznie usuwane po zakończeniu zdarzenia
- Przypadek użycia: Gdy minął termin adopcji **_Grupy Królików_**, a status grupy jest inny niż **_Adopted_**
- Do:
  - wolontariusza przypisanego do królika - codziennie do czasu poprawienia danych
  - manageraRegionu - codziennie, zaczynając od 4 dnia, do czasu poprawienia danych, po 14 dniach dodatkowo email
- Data:
  - groupId: id grupy

### Powiadomienie o wizycie weterynaryjnej

- Kategoria: `nearVetVisit`
- Typ: push
- Automatycznie usuwane po pojawieniu się powiadomienia o zakończeniu wizyty
- Przypadek użycia: Gdy zbliża się termin wizyty weterynaryjnej
- Do:
  - wolontariusza przypisanego do królika - 3 dni przed wizytą
- Data:
  - rabbitId: id królika
  - noteId: id notatki
  - rabbitName: imię królika, opcjonalne

### Powiadomienie o zakończeniu wizyty weterynaryjnej

- Kategoria: `vetVisitEnd`
- Typ: push
- Przypadek użycia: Gdy minął termin wizyty weterynaryjnej, aby przypomnieć o wprowadzeniu danych
- Do:
  - wolontariusza przypisanego do królika - jednorazowo
- Data:
  - rabbitId: id królika
  - noteId: id notatki
  - rabbitName: imię królika, opcjonalne
