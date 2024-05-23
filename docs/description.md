# Opis Aplikacji

Aplikacja ma za zadanie wspomagać Stowarzyszenie Pomocy Królikom.

Logika aplikacji zorganizowana jest wokół **_królików_**, które są podstawowym obiektem w systemie. Każdy **_królik_** przypisany jest do konkretnej **_grupy królików_**

## Główne pojęcia

### Królik (Rabbit)

Podstawowy obiekt w systemie, wokół którego zorganizowana jest logika aplikacji.

Odpowiada za przechowywanie informacji o króliku, takich jak: imię, wiek, płeć, status, zdjęcia, data przyjęcia, data adopcji, data urodzenia itp.

Każdy **_królik_** jest przypisany do **_grupy królików_**.

Wyróżniamy następujące **_statusy królika_**:

- **_Deceased_** - królik nie żyje, status archiwalny,
- **_Adopted_** - królik został adoptowany, status archiwalny
- **_Adoptable_** - królik jest gotowy do adopcji
- **_In Treatment_** - królik jest w trakcie leczenia, kastracji itp. (nie jest gotowy do adopcji)
- **_Incoming_** - królik oczekuje na dostarczenie do stowarzyszenia, status początkowy dla królika

### Grupa królików (Rabbit Group)

Zbiór **_królików_** (zazwyczaj 1 - 3 króliki), które są ze sobą powiązane.

Domyślnie **_grupa królików_** jest tworzona w momencie dodania nowego **_królika_**. Jednakże możliwe jest przypisanie **_królika_** do istniejącej **_grupy królików_**, a operacja ta powinna być wykonywana tylko na etapie dodawania nowego **_królika_** (tzn. Utwórz królika -> Zmień Grupę).

**_Grupa królików_** ma swój **_status grupy_**, który jest ustawiany na podstawie statusów **_królików_** wchodzących w jej skład.\
Wyszczególniamy **_statusy grupy_**:

- **_Deceased_** - grupa królików została uśpiona - grupa staje się archiwalna, wszystkie króliki w grupie mają status **_Deceased_**, Uwaga: jeśli jeden z królików w grupie ma status **_Deceased_** to wszystkie króliki w grupie powinny mieć status **_Deceased_**
- **_Adopted_** - grupa królików została adoptowana - grupa staje się archiwalna, wszystkie króliki w grupie mają status **_Adopted_**, Uwaga: jeśli jeden z królików w grupie ma status **_Adopted_** to wszystkie króliki w grupie powinny mieć status **_Adopted_**
- **_Adoptable_** - grupa królików jest gotowa do adopcji - wszystkie króliki w grupie mają status **_Adoptable_**
- **_In Treatment_** - grupa królików jest w trakcie leczenia, kastracji itp. (nie jest gotowa do adopcji) - przynajmniej jeden królik w grupie ma status **_In Treatment_**
- **_Incoming_** - grupa królików oczekuje na dostarczenie do stowarzyszenia - wszystkie króliki w grupie mają status **_Incoming_**, jest to status początkowy dla grupy królików, w tym statusie grupa nie musi mieć przypisanego **_Zespołu_**

Dozwolone kombinacje różnych statusów królików wchodzących w skład **_grupy królików_**:

- **_Adoptable_**, **_InTreatment_**
- **_Adoptable_**, **_InTreatment_**, **_Incoming_**
- **_InTreatment_**, **_Incoming_**

Uwaga: każda zmiana **_statusu królika_** wchodzącego w skład **_grupy królików_** powinna przekalkulować **_status grupy_**.

Każda **_grupa królików_** przez większość cyklu życia (oprócz początkowego **_status grupy_** -> **_Incoming_**) powinna mieć przypisany **_Zespół_**.

Grupa zawiera także informacje wspólne dla wszystkich królików wchodzących w jej skład odnośnie adopcji.

### Zespół (Team)

**_Zespół_** to zbiór **_Wolontariuszy_** przypisanych do konkretnych **_grup królików_**.

**_Zespół_** może być aktywny lub nieaktywny.

- Aktywny **_Zespół_** oznacza, że w zespole są przypisani aktywni **_Wolontariusze_**.
- Nieaktywny **_Zespół_** oznacza, że w zespole nie ma przypisanych aktywnych **_Wolontariuszy_**.
  - **_Zespół_** staje się nieaktywny, gdy wszystkie **_Wolontariusze_** w zespole zostaną oznaczeni jako nieaktywni.
  - **_Zespół_** staje się nieaktywny, gdy wszystkie **_Wolontariusze_** w zespole zostaną usunięci z zespołu i **_Zespół_** jest przypisany do co najmniej jednej **_grupy królików_**. Uwaga: nieaktywny **_Zespół_** nie może być przypisany do **_grupy królików_** której **_status grupy_** nie jest archiwalny.
  - **_Zespół_** powinien zostać usunięty, gdy nie ma przypisanych **_grup królików_**, a ostatni **_Wolontariusz_** w zespole zostanie z niego usunięty.

**_Zespół_** posiada historię przypisania **_Wolontariuszy_** w czasie.

### Wolontariusz (Volunteer)

**_Wolontariusz_** to **_Użytkownik_** posiadający **_Role_** **_Wolontariusz_**, który musi być przypisany do **_Zespołu_** (Nowy zespół jest tworzony w momencie dodania roli **_Wolontariusz_** do użytkownika, następnie można przenieść **_Wolontariusza_** do innego **_Zespołu_**).

### Użytkownik

**_Użytkownik_** to osoba posiadająca konto w systemie.

### Rola (Role)

**_Rola_** to uprawnienia przypisane do **_Użytkownika_**.

- Wyróżniamy następujące **_Role_**:
  - **_Admin_** - pełne uprawnienia do zarządzania systemem
  - **_Region Manager_** - pełne uprawnienia do zarządzania królikami i użytkownikami w swoim regionie
  - **_Region Observer_** - uprawnienia do podglądu królików w swoim regionie
  - **_Volunteer_** - uprawnienia do podglądu królików przypisanych do jego **_Zespołu_**

### Region

**_Region_** to obszar, w którym działa Stowarzyszenie Pomocy Królikom.
Odpowiada on za podział **_królików_** na obszary, które są zarządzane niezależnie przez **_Region Managerów_**.

Każdy obiekt w systemie (np. **_królik_**, **_grupa królików_**, **_Zespół_**, **_Użytkownik_**) jest przypisany do konkretnego **_Regionu_**.

Uwaga: W systemie powinien istnieć region administracyjny, który powinien mieć przypisane jedynie obiekty **_Użytkownik_** z rolą **_Admin_**, jednak jest to dobra praktyka, a nie wymóg systemu. \
Skrypt tworzący Admina automatycznie stworzy lub wyszuka region administracyjny(**_Administrators_**) i przypisze go do Admina. Dlatego też ta nazwa regionu jest zarezerwowana.

## Cykl życia królika(obiektu) - zmiana statusu

1. Utwórz królika

   - Status królika: **_Incoming_**

2. Wprowadź datę przyjęcia królika

   - Data teraźniejsza lub wcześniejsza
     - Zmiana statusu na **_In Treatment_**
   - Data przyszła - wyślij powiadomienie tego dnia z pytaniem czy królik został przyjęty
     - Status bez zmian (**_Incoming_**)
     - Po potwierdzeniu przyjęcia zmiana statusu na **_In Treatment_**

3. Zakończ leczenie królika

   - Wprowadzenie daty kastracji, - wyślij powiadomienie tego dnia + 2tyg z pytaniem czy królik został poddany zabiegowi i czy jest gotowy do adopcji
     - Status bez zmian (**_In Treatment_**)
     - Po potwierdzeniu gotowości zmiana statusu na **_Adoptable_**

4. Zakończ adopcję królika
   - Wprowadzenie daty adopcji - wyślij powiadomienie tego dnia z pytaniem czy królik został adoptowany
     - Status bez zmian (**_Adoptable_**)
     - Po potwierdzeniu adopcji zmiana statusu na **_Adopted_**

Uwaga: W każdym momencie można dokonać dowolnej zmiany statusu królika, jednakże powinno się to robić zgodnie z powyższym cyklem życia królika.
W takim przypadku zmiana statusu królika powinna być poprzedzona uzupełnieniem odpowiednich pól w zależności od nowego statusu.
Ustawienie statusu **_Deceased_** jest możliwe tylko w ten sposób.

## Funkcjonalności

### Zarządzanie królikami

Pozwala na dodawanie, edycję, usuwanie królików.

#### Możliwości z podziałem na role

- #### Region Manager
  - Pełna kontrola nad królikami w swoim regionie
    - dodawanie
    - edycja
    - usuwanie / archiwizacja
    - zmiana statusu
    - przypisanie do grupy
    - przypisanie do Wolontariusza
- #### Region Observer
  - Podgląd królików w swoim regionie
- #### Volunteer
  - Podgląd królików przypisanych do niego
    - Edycja swoich królików (w ograniczonym zakresie)

## Wizyty Weterynaryjne i Notatki

Pozwala na dodawanie, edycję, usuwanie wizyt weterynaryjnych i notatek dla królików.

### Główne pojęcia

#### Notatka (RabbitNote)

Obiekt przechowujący informacje o króliku, które są zmienne w czasie. tzn. waga, opis (np. zmiany w zachowaniu, obserwacje itp.)

#### Wizyta Weterynaryjna (VetVisit)

Obiekt rozszerzający notatkę o informacje z wizyty weterynaryjnej, takie jak: data wizyty, typ wizyty, informacje specyficzne dla konkretnego typu wizyty.

#### Typ Wizyty (VisitType)

Wyróżniamy następujące typy wizyt:

- **_Kontrola_**
- **_Szczepienie_** - informacje specyficzne: rodzaj szczepionki
- **_Odrobaczenie_**
- **_Leczenie_**
- **_Operacja_** - informacje specyficzne: rodzaj operacji
- **_Kastracja_** - ten typ wizyty może być przypisany tylko raz dla królika
- **_Chipowanie_** - ten typ wizyty może być przypisany tylko raz dla królika specyficzne informacje: numer chipa

Dla jednej wizyty weterynaryjnej można przypisać wiele typów wizyt.
Uwaga: **_Kontrola_** i **_Leczenie_** wzaajemnie się wykluczają, tzn. nie można przypisać jednocześnie typu wizyty **_Kontrola_** i **_Leczenie_** do jednej wizyty.

### Możliwości z podziałem na role

- #### Region Manager
  - Pełna kontrola nad notatkami i wizytami weterynaryjnymi królików w swoim regionie (możliwość dodawania, edycji, usuwania dowolnej notatki lub wizyty)
- #### Region Observer
  - Podgląd notatek i wizyt weterynaryjnych królików w swoim regionie
  - Dodawanie notatek (bez możliwości dodawania wizyt weterynaryjnych i wagi)
  - Edycja/usuwanie swoich notatek
- #### Volunteer
  - Podgląd notatek i wizyt weterynaryjnych przypisanych do "swoich" królików
  - Dodawanie notatek oraz wizyt weterynaryjnych dla "swoich" królików
  - Edycja/usuwanie swoich notatek oraz wizyt weterynaryjnych
