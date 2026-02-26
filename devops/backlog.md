# Backlog (od początku projektu)

## Zrealizowane
- Szkielet backendu (.NET + REST + EF Core + Identity + JWT) oraz frontendu (React) z logowaniem.
- Dodane migracje EF Core, Ensure/Migrate na starcie, seeding ról i kont (admin/lekarz/pacjent) oraz TokenRevocation + logout.
- Funkcjonalności domenowe: pacjenci, pomiary z tagami/eksport CSV/PDF, objawy, wyzwalacze, leki, alerty (powietrze/pyłki), raport PDF (QuestPDF), role i uprawnienia (patient ograniczony do własnych danych).
- PWA + Chart.js trend cards, routing, tryb demo z polskimi danymi i eksportem CSV/PDF, UI po polsku.
- Docker Compose (API+frontend), smoke testy (api_smoke.sh) E2E, testy roli pacjenta (403 na cudzych danych).
- Dokumentacja przeniesiona i zaktualizowana (Markdown w dokumentacja/, PDF w dokumentacja/instrukcje), README uzupełnione, .gitignore rozszerzone.

## Do zrobienia / otwarte
- Push commits to origin/main.
- Lokalny smoke test po ostatnich zmianach UI/doc (API+UI).
- Ustawić silny `JwtSettings__Key` w środowisku (nie w pliku) i opisać to w README/dokumentacji.
- Przegląd appsettings pod kątem sekretów/placeholderów (CORS, JWT, connection strings).
- Zweryfikować konfigurację CORS (tylko localhost w trybie lokalnym) i dopisać w README.
- Uruchomić migracje na czystej bazie (po zmianie OwnerUserId/validacji) i potwierdzić start.
- Sprawdzić linki w README/dokumentacji po przeniesieniu plików.
- Potwierdzić, że .gitignore obejmuje bazy, logi, artefakty build.
