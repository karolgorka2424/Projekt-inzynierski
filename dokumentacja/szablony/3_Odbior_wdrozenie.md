# Odbiór i wdrożenie

## Procedura odbioru
- Środowisko test/uat z migracjami i seedem kont demo (Admin/Doctor/Patient) oraz przykładowymi pacjentami.
- Kryteria akceptacji: logowanie, role (Patient nie widzi innych pacjentów), CRUD na pomiarach/objawach/wyzwalaczach/lekach, eksport CSV/PDF, poprawne komunikaty 403/404, brak błędów krytycznych w logach.
- Protokół zgodności z zamówieniem + lista usterek; harmonogram poprawek i retest.

## Warunki wstępne do wdrożenia
- Techniczne: .NET 10 runtime, baza (SQLite domyślnie lub docelowa), reverse proxy/HTTPS (dla prod – do dodania gdy pojawi się domena), Node jeśli build frontu na serwerze.
- Konfiguracja: connection string, `JwtSettings:Key/Issuer/Audience/DurationInMinutes`, klucz do AirPollen (jeśli używany).
- Dane startowe: `dotnet ef database update` + seeder ról i kont demo (wykonywany przy starcie aplikacji).

## Proces wdrożenia (prod)
- Na ten moment brak środowiska prod – pracujemy lokalnie. Gdy środowisko będzie gotowe:
	- Backend: `dotnet publish -c Release -o out`; wdrożenie (systemd/docker), ustawienie env dla JWT/DB, migracje przed startem.
	- Frontend: `npm run build`; deploy statyczny (nginx/Apache/S3+CF). Ustawić adres API w env frontu.
	- CORS/HTTPS: dodać domenę prod do CORS, włączyć HTTPS na reverse proxy.
	- Okno wdrożeniowe: opcjonalnie pilotaż / ograniczona grupa.

## Kopia zapasowa
- Zakres: baza danych, pliki konfiguracyjne, sekrety (osobno), ewentualne dane generowane (raporty) jeśli są utrzymywane.
- Typ/interwał/retencja: pełna/przyrostowa; min. dzienna dla prod; retencja zgodna z polityką klienta/RODO.
- Miejsce składowania: zaszyfrowane repozytorium/obiektówka; dostęp kontrolowany.

## Odtworzenie systemu
- Przygotowanie środowiska: zależności (runtime, reverse proxy), czysta baza/plik DB.
- Odtworzenie DB z kopii (narzędzie zgodne z wybraną bazą; dla SQLite – podmiana pliku lub import).
- Odtworzenie backend/frontendu: z artefaktu publish/build; zachować wersję zgodną z kopią bazy.
- Walidacja: healthcheck (do dodania), smoke test ról (Admin/Doctor/Patient), weryfikacja eksportów CSV/PDF.
