# Dokumentacja użytkownika

## Opis produktu i ról
Respira Libere to aplikacja webowa do monitorowania stanu pacjentów (astma/objawy/wyzwalacze/leki). Role i uprawnienia:
- **Admin** – pełny dostęp (zarządzanie pacjentami, danymi klinicznymi, użytkownikami).
- **Doctor** – pełny dostęp do danych pacjentów (bez administracji użytkownikami), może tworzyć pacjentów.
- **Patient** – dostęp wyłącznie do własnych danych (przegląd i edycja pomiarów/objawów/wyzwalaczy/leków), brak dostępu do listy pacjentów.

## Dostęp do aplikacji
- URL backendu domyślnie: `http://localhost:5000` (dev). Frontend: `http://localhost:3000` (CRA) lub statyczny build.
- Logowanie: email/username + hasło. Konta demo z seedera: `admin@example.com`, `lekarz@example.com`, `pacjent@example.com` (hasło `Password1!`).
- Reset hasła: opcja w menu konta (wysyła token zwrotny w odpowiedzi API do celów testowych).

## Jak korzystać (HOW-TO)
1. **Logowanie**: podaj email/username i hasło; po zalogowaniu widzisz dashboard i swoje role.
2. **Pacjenci**:
	- Admin/Doctor: lista pacjentów, dodawanie/edycja/usuwanie.
	- Patient: brak listy, widok automatycznie filtrowany do własnego pacjenta.
3. **Pomiary**: wejdź w szczegóły pacjenta → zakładka Pomiary → dodaj datę, wartość, tagi; filtruj po dacie i tagu; usuń wpis z listy.
4. **Objawy / Wyzwalacze / Leki**: analogicznie do pomiarów – dodawanie wpisów, usuwanie, filtrowanie (daty dla objawów/wyzwalaczy).
5. **Raporty i eksport**: na widoku pacjenta dostęp do pobrania raportu PDF lub CSV (historia danych). W trybie demo dostępny jest mock PDF.

## Opis głównych ekranów
- **Dashboard / Lista pacjentów**: karty pacjentów (Admin/Doctor), przycisk „Dodaj pacjenta”. Dla Patient ekran przechodzi od razu do własnych danych.
- **Szczegóły pacjenta**: zakładki Pomiary, Objawy, Wyzwalacze, Leki; przyciski dodawania/usuń przy rekordach; filtry daty/tagu; akcje eksportu CSV/PDF.
- **Profil użytkownika**: zmiana hasła, zmiana email/username (tylko własne konto).

## FAQ
- **Nie widzę listy pacjentów** – rola Patient ma dostęp tylko do własnego pacjenta.
- **Brak przycisku „Usuń pacjenta”** – tylko Admin/Doctor mogą usuwać lub edytować pacjentów.
- **Brak dostępu (403) do danych innego pacjenta** – mechanizm bezpieczeństwa `pid` ogranicza Patient do własnych danych.
- **PDF/CSV nie pobiera się** – sprawdź blokery pobrań (adblock), spróbuj w innej przeglądarce; w trybie demo używany jest mock PDF.

## Wsparcie
Kanał wsparcia (email/chat/telefon) oraz przewidywany czas reakcji – do uzupełnienia wg projektu.
