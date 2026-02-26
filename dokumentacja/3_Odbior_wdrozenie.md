# Odbiór i wdrożenie

## Procedura odbioru
- Środowisko: lokalne (API `http://localhost:5000`, front `http://localhost:3000`), po migracjach i seedzie kont demo (Admin/Doctor/Patient) oraz przykładowych pacjentów.
- Kryteria akceptacji: logowanie, role (Patient nie widzi innych pacjentów), CRUD na pomiarach/objawach/wyzwalaczach/lekach, eksport CSV/PDF, poprawne komunikaty 403/404, brak błędów krytycznych w logach.
- Protokół zgodności z zamówieniem + lista usterek; harmonogram poprawek i retest.

## Warunki wstępne do uruchomienia (lokal)
- Techniczne: .NET 10 runtime, SQLite (domyślna baza), Node jeśli build frontu na tej samej maszynie.
- Konfiguracja: connection string, `JwtSettings:Key/Issuer/Audience/DurationInMinutes`, klucz do AirPollen (jeśli używany).
- Dane startowe: `dotnet ef database update` + seeder ról i kont demo (wykonywany przy starcie aplikacji).

## Proces uruchomienia (lokal)
- Backend: `dotnet run --urls http://localhost:5000` (po `dotnet ef database update`).
- Frontend: `npm start` (CRA proxy do API) lub `npm run build` i serwowanie statyczne.
- CORS: domyślnie localhost; jeśli front jest na innym porcie/hostie, dopisać go do listy w konfiguracji.

## Kopia zapasowa
- Zakres: baza danych, pliki konfiguracyjne, sekrety (osobno), ewentualne dane generowane (raporty) jeśli są utrzymywane.
- Typ/interwał/retencja: pełna/przyrostowa; min. dzienna dla prod; retencja zgodna z polityką klienta/RODO.
- Miejsce składowania: zaszyfrowane repozytorium/obiektówka; dostęp kontrolowany.

## Odtworzenie systemu
- Przygotowanie środowiska: zależności (runtime, reverse proxy), czysta baza/plik DB.
- Odtworzenie DB z kopii (narzędzie zgodne z wybraną bazą; dla SQLite – podmiana pliku lub import).
- Odtworzenie backend/frontendu: z artefaktu publish/build; zachować wersję zgodną z kopią bazy.
- Walidacja: healthcheck (do dodania), smoke test ról (Admin/Doctor/Patient), weryfikacja eksportów CSV/PDF.
