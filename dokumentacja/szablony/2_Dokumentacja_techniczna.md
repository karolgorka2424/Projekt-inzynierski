# Dokumentacja techniczna

## Cel i zakres
Opis architektury, zależności, uruchomienia, API, bazy danych i procedur operacyjnych dla Respira Libere (backend ASP.NET Core + frontend React).

## Architektura
- Backend: ASP.NET Core 10, JWT + Identity, EF Core + SQLite (domyślnie). Middleware revokacji tokenów.
- Frontend: React (CRA) z logiką ról (Admin/Doctor/Patient) i eksportami CSV/PDF.
- Integracje: klient AirPollen (pogoda/polen) – wymaga klucza.

## Wymagania środowiskowe
- .NET SDK 10.x, Node 18+ (dla build frontendu), SQLite (wbudowany), przeglądarka Chromium/Chrome/Edge.
- Dev URL: API `http://localhost:5000`, Front `http://localhost:3000`.
- Brak środowiska prod: pracujemy lokalnie; gdy pojawi się domena prod, dodamy ją do CORS i włączymy HTTPS na reverse proxy.

## Zależności kluczowe (backend)
- Microsoft.AspNetCore.Authentication.JwtBearer 7.0.0
- Microsoft.AspNetCore.Identity.EntityFrameworkCore 7.0.0
- Microsoft.EntityFrameworkCore.Sqlite/Tools 7.0.0
- QuestPDF 2024.3.0 (PDF)
- System.IdentityModel.Tokens.Jwt 8.15.0

## Konfiguracja
- appsettings.json: `JwtSettings:{Key,Issuer,Audience,DurationInMinutes}`, `ConnectionStrings:DefaultConnection` (domyślnie `Data Source=respira.db`).
- Ustaw JWT key przez env (np. `export JwtSettings__Key=$(openssl rand -hex 32)`); nie używaj klucza z pliku w środowisku innym niż lokal dev.
- CORS: dla lokalnego frontu ustawione na localhost:3000; gdy pojawi się prod, dodaj domenę.
- Role i konta demo w seederze (Admin/Doctor/Patient) – ładowane przy starcie po migracjach.

## Model danych (skrót)
- Patients(Id, Name, Notes)
- Measurements(Id, PatientId, Value, Tag, RecordedAt)
- SymptomEntries(Id, PatientId, RecordedAt, Notes/Severity jeśli w modelu)
- TriggerEntries(Id, PatientId, RecordedAt, Description/Tag)
- Medications(Id, PatientId, Name, Dosage, Notes)
- Identity tables (AspNetUsers, AspNetRoles, AspNetUserRoles…)
- RevokedTokens(Jti, ExpiresAt)

## Migracje i seedy
- Migracje w projekcie API; uruchomienie: `dotnet ef database update` (z katalogu API).
- Seeder ról i kont demo: wykonywany w Program.cs podczas startu (po migracji).

## API (role i własność)
- Auth: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/change-password`, `PUT /api/auth/profile`, reset password (request/reset).
- Patients: `GET /api/patients` (Patient dostaje tylko własny rekord), `GET /api/patients/{id}`, `POST/PUT/DELETE` (Admin, Doctor).
- Measurements/Symptoms/Triggers/Medications: ścieżka `/api/patients/{patientId}/...`, role Admin/Doctor/Patient; dla Patient weryfikacja claim `pid` = `patientId` (własność).
- Reports: CSV/PDF eksport per pacjent (mock PDF w trybie demo).

## Uruchomienie (dev)
1) `dotnet restore` (backend), `npm install` (frontend).
2) `dotnet ef database update` (w katalogu API).
3) `dotnet run --urls http://localhost:5000` (API).
4) Frontend: `npm start` (proxy do API) lub zdefiniować `REACT_APP_API_URL` i użyć `npm start`/`npm run build`.

## Uruchomienie (prod)
- Backend: `dotnet publish -c Release -o out`; uruchomić przez systemd/docker/reverse proxy; skonfigurować HTTPS i CORS (AllowLocalhostFrontend lub własna domena).
- Frontend: `npm run build`, serwować statycznie (nginx/Apache). Skonfigurować API URL w env.
- Sekrety/JWT klucze przechowywać poza repo (env/secret store).

## Monitoring i logowanie
- Logi domyślnie na stdout (Kestrel); zalecane dodać structured logging (Serilog) w przyszłości.
- Health check: `/health` (dodany w Program.cs).

## Testy
- Rekomendacja: testy integracyjne kontrolerów (autoryzacja ról, 403 na cudzym `patientId`), e2e (login, CRUD, eksport).

## Znane decyzje / ograniczenia
- Własność danych pacjenta kontrolowana claimem `pid` w tokenie JWT.
- SQLite jako domyślna baza (dla prod rozważyć PostgreSQL/MySQL/SQL Server).
