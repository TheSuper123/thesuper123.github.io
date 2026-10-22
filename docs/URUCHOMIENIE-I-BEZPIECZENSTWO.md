# Uruchomienie i ustawienia produkcyjne

Strona jest statyczna. Uruchom z katalogu repozytorium:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Nie ma procesu budowania ani zależności wymaganych do zwykłego uruchomienia. Gry otwierają się również bez konta i bez dostępu do zewnętrznych usług. Publikacja statycznej strony odbywa się przez GitHub Pages po aktualizacji gałęzi skonfigurowanej jako źródło. Ustawienia produkcyjnego Firebase konfiguruje się osobno w konsoli.

## Testy

`tests/smoke.py` uruchamia własny serwer na wolnym porcie i przeglądarkę Chromium. Środowisko robocze ma Python Playwright 1.62.0 oraz `/usr/bin/chromium`. W innym środowisku potrzebne są te narzędzia; ścieżkę przeglądarki można podać w `CHROMIUM_PATH`.

Pięć dodanych gier i ich 17 testów funkcjonalnych opisano w [NOWE-GRY.md](NOWE-GRY.md). Nie potrzebują odszyfrowania archiwum.

```sh
python3 tests/smoke.py
python3 tests/test_others.py
```

Testy sprawdzają katalog, odmowę i cofnięcie zgody, trwałość ulubionych, brak zewnętrznych żądań podczas zwykłego grania, układ mobilny, wszystkie 13 gier publicznego katalogu i ruchy komputera oraz rzeczywiste uruchomienie SDK Firebase. Operacje konta testowane są z symulowanymi odpowiedziami HTTP usługi Firebase. Nie tworzą, nie modyfikują ani nie usuwają kont produkcyjnych. Testy nie potwierdzają ustawień usługodawcy ani dostarczania wiadomości e-mail.

## Wygląd gier i ciemny motyw

Przełącznik w nagłówku zmienia motyw strony, paneli konta, gier i zagnieżdżonych ramek archiwum. Pierwsze wejście uwzględnia ustawienie systemu. Wybór działa w sesji karty; dopiero zgoda na preferencje pozwala zapamiętać go na kolejne wizyty. Szczegóły zapisu opisuje polityka prywatności. Kod pierwszego wyświetlenia jest w `assets/theme.js`, palety w `assets/theme.css`, a oprawa gier w `assets/game.css` i `assets/game-ui.js`.

Zmieniono także kolory rysowane na canvasach, plansze, menu, wyniki i przyciski. Włączenie motywu nie resetuje rozgrywki. Poprawiono pozycjonowanie sterowania Snake Areny po zmianie rozmiaru oraz przyciski i ponowne rozpoczęcie Labiryntu. Starszy Przekaźnik, quiz i strony pomocnicze mają tę samą oprawę. W kompilacji Unity Geometry Dash Lite zmieniono stronę osadzenia, loader i sterowanie; grafika wewnątrz skompilowanego silnika pozostaje wcześniejsza i wymaga projektu źródłowego do przebudowy.

Pełny późniejszy przegląd objął mechanikę każdej gry, aktywne rundy, opóźnienia wejścia, tempo przy różnych FPS, pauzę, restart, telefon i archiwum. Szczegółowy zakres, ograniczenia i polecenia testów: [PRZEGLAD-GIER.md](PRZEGLAD-GIER.md).

Aktualne podglądy: [jasny](screenshots/desktop.png), [ciemny](screenshots/desktop-dark.png), [telefon](screenshots/mobile.png), [gra na telefonie](screenshots/game-mobile.png), [zamknięte others](screenshots/others.png).

## Firebase — wymagane sprawdzenie przez właściciela

- W Authentication → Sign-in method włączyć Email/Password i Google, jeśli jeszcze nie są włączone.
- W Authentication → Settings → Authorized domains sprawdzić `www.spinnerrealyt.pl` (aktualny CNAME) oraz inne faktycznie używane domeny serwisu, np. `thesuper123.github.io`, jeżeli tam również ma działać logowanie. `localhost` dodać wyłącznie, jeśli potrzebne są lokalne testy logowania. Nie wpisywać schematów ani ścieżek.
- Sprawdzić szablony e-mail, nazwę projektu, domenę akcji i przekierowania. Przetestować własnym kontem Google i kontem e-mail na docelowym HTTPS: weryfikację, reset, zmianę e-mail, wylogowanie i usunięcie konta. Weryfikacja przez operatora nie została wykonana w tej pracy — brak konta testowego i uprawnień do konsoli.
- Publiczny klucz konfiguracji Firebase w `assets/auth.js` nie jest sekretem administracyjnym. Bezpieczeństwo nie może zależeć od jego ukrycia. Stosować ograniczenia klucza odpowiednie dla Firebase i domen aplikacji; rozważyć ochronę przed enumeracją adresów oraz dostępne mechanizmy antynadużyciowe.
- Bieżący kod nie korzysta z Realtime Database. Stare `users_map`, `users` i `users_progress` mogły zawierać dane według nicku. Nie odczytywano ich w audycie. Nie potwierdzono reguł serwera. Wyłączyć dostęp starych klientów, sprawdzić retencję oraz obsłużyć dane historyczne zgodnie z obowiązkami administratora. Plik `firebase-realtime-database.rules.json` jest propozycją odmowy dostępu dla nieużywanej bazy; **nie został wdrożony**. Przed jego wdrożeniem ustalić, czy z tej samej bazy nie korzystają inne aplikacje.
- Usunięcie konta w nowym panelu usuwa Firebase Authentication. Nie udaje automatycznej likwidacji niezweryfikowanych historycznych danych w Realtime Database. Żądania dotyczące tych danych obsługuje właściciel przez kontakt podany w polityce.

Nowe logowanie używa Firebase Auth i UID, e-mail zamiast publicznego mapowania nick → e-mail, trwałości sesyjnej i ponownego uwierzytelniania przed zmianą adresu oraz usunięciem konta. Interfejs nie uznaje wartości localStorage za dowód zalogowania. Zapis wyników jest teraz lokalny i zależy od zgody, bez fikcyjnego rankingu lub synchronizacji chmurowej.

SDK jest serwowane lokalnie. W trakcie pracy inicjalizacja rzeczywistego SDK 13.0.0 przeszła w Chromium. Bezpośredni odczyt publicznej konfiguracji projektu z `identitytoolkit.googleapis.com` został zablokowany przez sieciowy proxy środowiska (HTTP 403 dla tunelu). Nie oznacza to błędu Firebase ani nie potwierdza konfiguracji docelowej domeny. Nie wyłączano TLS i nie wykonywano prób z cudzymi danymi.

## Klucz w starszym czacie — działanie właściciela

W starym `aigemzegar.html` znaleziono osadzony klucz Google Generative Language API. Usunięto klucz i integrację z bieżącego pliku; dawny adres pokazuje stronę archiwalną. **Unieważnić / zrotować stary klucz w Google Cloud**, sprawdzić wykorzystanie i limity. Klucz może nadal być w historii Git oraz w wcześniej opublikowanej wersji. Nie wypisywano jego wartości i nie wysyłano nim żądań. Nie używać kluczy rozliczeniowych w publicznym JavaScript; ewentualny przyszły czat wymaga zaplecza z uwierzytelnianiem i limitami.

## Prywatność, prawa do treści i reklamy

Podano otrzymane dane: Marcel Jaroszewski, kontakt@spinnerrealyt.pl. Właściciel powinien potwierdzić działanie skrzynki, warunki usług dostawców, retencję historycznych danych i ewentualne dodatkowe obowiązki związane z formą prowadzenia działalności. Polityka opisuje aktualny kod i rozdziela dane niezbędne od opcjonalnych. Nie zastępuje to audytu prawnego faktycznej działalności.

Reklamy AdSense, `ads.txt`, plik wcześniejszej reklamy i wzmianki o usuniętej domenie zostały usunięte. Obecnie nie ma marketingu ani analityki, więc panel zgód nie udaje certyfikowanej CMP Google. Dodanie reklam wymaga osobnego wdrożenia zgodnego z aktualnymi wymaganiami Google. Nie można zagwarantować zatwierdzenia AdSense zmianami frontendu.

Lista materiałów do wyjaśnienia: [PRAWA-DO-MATERIALOW.md](PRAWA-DO-MATERIALOW.md).

## DOOM w archiwum others

Poprawiono ścieżkę osadzenia, brakujące rozszerzenia przejść i strukturę dokumentów, dodano responsywne obrazy oraz opisane przyciski. Brakujący `6.png` zastąpiono istniejącym wariantem tego ujęcia `6A.png`; nie dorabiano cudzych grafik. Późniejszy przegląd dodał spójną misję z kluczem, czterema posterunkami i ewakuacją, mapę, klawiaturę, rzeczywiste blokady i poprawne cofanie. To gra oparta na ekranach HTML, nie silnik FPS oryginalnego DOOM-a.

## Szyfrowane others

Materiały wymagające weryfikacji zostały wydzielone do `others`, usunięte z publicznego katalogu i zastąpione szyfrogramami. Archiwum działa na HTTPS za pośrednictwem Web Crypto i service workera. Nie dodawaj tam jawnych kopii materiałów. Instrukcje weryfikacji, odzyskiwania i ograniczenia ochrony: [others/README.md](../others/README.md).

Sprawdzono odblokowanie rzeczywistym hasłem i rozgrywkę zaszyfrowanych Tetrisa oraz Dooma w Chromium, a także odmowę dostępu po zamknięciu sesji. Zwykłe testy automatyczne nie zawierają tego hasła; używają oddzielnego archiwum tymczasowego. Przeniesienie plików nie usuwa ich wcześniejszych wersji z Git ani z dotychczasowego wdrożenia.
