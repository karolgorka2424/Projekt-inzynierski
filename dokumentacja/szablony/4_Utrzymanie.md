# Utrzymanie produktu

## Wersjonowanie i wydania
- Semver X.Y.Z; Z – poprawki/bugfix, Y – nowe kompatybilne funkcje, X – breaking changes.
- Release notes: lista zmian funkcjonalnych, poprawki, breaking changes, zmiany zależności/środowiska (np. aktualizacja QuestPDF, dotnet).
- Cykle: preferowany stały rytm (np. co 2–4 tyg.), hotfixy krytyczne poza cyklem.

## Serwis i zgłoszenia

## Monitoring i wydajność
 Dev: lokalne, CORS ograniczone do localhost.
 Prod: brak na dziś; po pojawieniu się domeny dodać ją do CORS i włączyć HTTPS na reverse proxy.
- Testy wydajnościowe: przed większym wydaniem (np. JMeter/k6), na danych zbliżonych do produkcji.

 Klucze JWT (`JwtSettings:Key` min 32 znaki) i connection string ustawiane przez zmienne środowiskowe. Nie commitować sekretów.
 CORS: na dziś tylko localhost; gdy będzie domena, dopisz ją do listy.
- Horyzontalne (więcej instancji API) lub wertykalne (CPU/RAM/IO); dopasować do limitów DB i sieci.
- Wpływ na kompatybilność: przy większych zmianach DB wymagane migracje i zgodność wersji aplikacji.

## Konfiguracja i sekrety
- Sekrety (JWT key, klucze API) przechowywać poza repo; rotować cyklicznie i po incydentach.
- Dostęp do środowisk przez role/opiekunów; audyt zmian w konfiguracji.

## Znane decyzje / ograniczenia
- Kontrola własności danych po claim `pid` w JWT – Patient tylko własne rekordy.
- SQLite jako baza domyślna: w produkcji zaleca się docelową bazę serwerową (PostgreSQL/MySQL/SQL Server) i dostosowanie connection string + migracji.
