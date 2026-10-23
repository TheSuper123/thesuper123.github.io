# Spinner na ekranie początkowym i offline

Publiczna aplikacja webowa (PWA), bez pakietu z App Store. Strona `aplikacja.html` zawiera instrukcję Safari na iPhonie, pobieranie zestawu wszystkich 101 gier, postęp, wstrzymanie, wznowienie i usuwanie plików. Odnośnik jest przy głównym haśle, w osobnym panelu na stronie głównej i w stopce. Android ma zapowiedź osobnej instrukcji instalacji.

## Instalacja na iPhonie

1. Otwórz stronę w Safari i pobierz zestaw offline.
2. Udostępnij → Dodaj do ekranu początkowego. Jeśli Safari pokazuje przełącznik otwierania jako aplikacji internetowej, włącz go.
3. Uruchom nową ikonę. Wejdź w „Pobierz aplikację” i sprawdź komunikat „Gotowe”. Pamięć aplikacji i Safari może być osobna zależnie od iOS; wtedy pobierz pliki ponownie w aplikacji.
4. Przed wyjazdem sprawdź grę w trybie samolotowym. Dodanie ikony samo w sobie nie potwierdza pobrania.

Manifest ma względny identyfikator, zakres i adres startowy, tryb `standalone` i własne ikony. Ekrany respektują bezpieczne obszary wycięcia oraz wskaźnika gestów. Nie ma blokady orientacji. iOS decyduje o zachowaniu plików i może je usunąć przy braku miejsca. Prośba o trwały zapis jest wyłącznie próbą; nie daje gwarancji.

## Co zapisuje worker

`service-worker.js` obsługuje wyłącznie listę publicznych plików z `assets/offline-pack.js`. Automatycznie przygotowuje interfejs, fonty i ilustracje katalogu, następnie zapisuje odwiedzane gry; pełne pobranie następuje na żądanie. Zestaw zawiera statyczne strony, silniki, instrukcje, lokalne fonty oraz ilustracje. Nie zawiera sesji konta, SDK Firebase, odpowiedzi sieciowych Firebase, opinii, wyników kompasu, odszyfrowanych plików ani kluczy archiwum.

Cache Storage `spinner-public-<wersja>` służy funkcji offline. Jest niezależny od zgody na opcjonalne `spinner:prefs:*`. Wycofanie zgody na preferencje usuwa preferencje; usuwanie zestawu offline usuwa pliki aplikacji. Ustawienia przeglądarki mogą usunąć obie kategorie. Podczas dalszego używania serwisu odwiedzane pliki znów trafiają do cache.

`others/` zachowuje własny worker o węższym zakresie i sesyjny klucz deszyfrowania. Worker publiczny nie przechwytuje żądań do archiwum ani poleceń z jego stron. Czyszczenie i aktualizacja kasują wyłącznie cache z publicznym prefiksem. Logowanie, archiwum i linki zewnętrzne wymagają sieci. Wszystkie 100 publicznych pozycji, w tym statyczny kompas polityczny, działają offline. Odpowiedzi kompasu nadal są tylko w pamięci karty.

## Przerwanie i aktualizacje

Równolegle pobierane są cztery pliki. HTTP z błędem lub dokument błędu HTML zamiast silnika nie jest uznawany za poprawnie pobrany plik. Stan „Gotowe” wynika z obecności wszystkich pozycji listy w cache. Przerwanie zostawia poprawne pliki do ponowienia. Jeśli brakująca gra jest otwierana bez internetu, aplikacja pokazuje stronę wyjaśniającą pobieranie.

Nowy worker najpierw pobiera nowy interfejs i nowe wersje wcześniej zapisanych gier. Jeśli pełny zestaw był pobrany, przygotowuje cały nowy zestaw, zanim zastąpi stary worker. Nie wymusza odświeżenia trwającej rundy. Przycisk aktualizacji odświeża kartę, w której został wybrany; pozostałe karty nie przeładowują się automatycznie. Zamknięcie wszystkich kart może pozwolić przeglądarce aktywować przygotowaną aktualizację, zachowując zestaw offline.

## Zmiany kodu i weryfikacja

Po zmianie publicznego kodu, stron, fontów, ilustracji lub workera uruchom:

```sh
python3 scripts/build_offline_pack.py
python3 scripts/build_offline_pack.py --check
python3 tests/test_pwa.py
```

Generator uwzględnia zawartość plików i workera w wersji cache. Nie edytuj ręcznie wygenerowanej listy. Zmiana samej dokumentacji lub testów nie zmienia wersji. Ikony powstają z własnego znaku SVG przez `python3 scripts/build_app_icons.py` (Playwright + Chromium).

Dziesięć testów używa prawdziwego service workera w Chromium: pobranie, 101 uruchomień bez sieci, nowe okno bez pamięci dokumentu, zmiany query string, katalog z ilustracjami i szybka runda offline, logowanie offline bez żądań SDK, niepełny transfer, ponowienie, wstrzymanie, czyszczenie, aktualizacja bez utraty zestawu, zachowanie starego zestawu przy nieudanej aktualizacji, ponowienie pierwszego przygotowania, osobny zakres archiwum oraz dwie instalacje w różnych podkatalogach tej samej domeny. Weryfikacja wizualna obejmuje jasny i ciemny motyw oraz szerokości 320, 390, 844 i 1440 px. Automatyzacja Chromium nie zastępuje ręcznego testu instalacji na fizycznym iPhonie.

Podglądy: [komputer](screenshots/pwa/desktop.png), [iPhone](screenshots/pwa/iphone.png), [ciemny motyw](screenshots/pwa/iphone-dark.png), [gotowy zestaw bez sieci](screenshots/pwa/offline-ready.png).
