# Utrzymanie produktu

## Wersjonowanie i wydania
- Semver X.Y.Z; Z – poprawki/bugfix, Y – nowe kompatybilne funkcje, X – breaking changes.
- Release notes: lista zmian funkcjonalnych, poprawki, breaking changes, zmiany zależności/środowiska (np. aktualizacja QuestPDF, dotnet).
- Cykle: preferowany stały rytm (np. co 2–4 tyg.), hotfixy krytyczne poza cyklem.

## Serwis i zgłoszenia
Kanały i SLA do ustalenia (projekt uczelniany, brak produkcyjnego NOC/SLA).

## Monitoring i wydajność
- Środowisko: wyłącznie lokalne (CORS ograniczony do localhost). Brak prod.
- Testy wydajnościowe: opcjonalne (JMeter/k6) przed większymi zmianami, na lokalnym środowisku.
- Skalowanie: w razie potrzeby horyzontalne/wertykalne; pamiętać o limitach DB/IO nawet lokalnie.
- Zmiany schematu: przy migracjach utrzymywać zgodność wersji aplikacji z bazą.

## Konfiguracja i sekrety
- Klucze JWT (`JwtSettings:Key` min 32 znaki) i connection string ustawiane przez zmienne środowiskowe. Nie commitować sekretów.
- CORS: tylko localhost; jeśli ktoś uruchamia na innej maszynie, dopisać jej adres.
- Sekrety (JWT key, klucze API) przechowywać poza repo; rotować cyklicznie i po incydentach.
- Dostęp do środowisk przez role/opiekunów; audyt zmian w konfiguracji.

## Znane decyzje / ograniczenia
- Kontrola własności danych po claim `pid` w JWT – Patient tylko własne rekordy.
- SQLite jako baza domyślna; brak planu środowiska prod w ramach projektu.
