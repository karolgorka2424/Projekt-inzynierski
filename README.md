# Respira Libere

Backend: ASP.NET Core Web API (.NET 10) z Identity/JWT/EF Core (SQLite domyślnie). Frontend: React (CRA).

Projekt przeznaczony do użytku lokalnego (brak planu produkcyjnego środowiska).

## Szybki start (dev)
1) Backend
```bash
cd backend/RespiraLibere.Api
 dotnet restore
 dotnet ef database update
 dotnet run --project RespiraLibere.Api.csproj --urls http://localhost:5000
```

2) Frontend
```bash
cd frontend
 npm install
 npm start   # domyślnie proxy do http://localhost:5000
```

## Konfiguracja (kluczowe)
- Ustaw silny sekret JWT: env `JwtSettings__Key` lub w appsettings.json (min. 32 bajty, inny niż domyślny).
- CORS: na dziś tylko localhost (`Cors:AllowedOrigins` ustaw na lokalne adresy frontu/API).
- HTTPS: opcjonalnie reverse proxy/certyfikaty, jeśli uruchamiasz lokalnie z proxy.
- Baza: SQLite do dev; brak planowanego środowiska prod.

## Docker
```bash
docker-compose build
docker-compose up -d
```

## Dokumentacja
- Markdown: dokumentacja/1_Dokumentacja_uzytkownika.md, dokumentacja/2_Dokumentacja_techniczna.md, dokumentacja/3_Odbior_wdrozenie.md, dokumentacja/4_Utrzymanie.md
- PDF: dokumentacja/instrukcje/ (wersje użytkownik/techniczna/odbiór/utrzymanie)

## Przydatne
- Jeśli port zajęty (np. 5000):
```bash
./scripts/port_utils.sh check 5000
./scripts/port_utils.sh kill 5000
```
- DataProtection keys: ./data/keys (nie commitować, zabezpieczyć backup).
- Konta demo z seedera: admin@example.com, lekarz@example.com, pacjent@example.com (hasło Password1!).
