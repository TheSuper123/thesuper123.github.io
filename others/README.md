# Others — szyfrowane archiwum do przeglądu

Wejście: `others/index.html`. Działa na HTTPS, w tym GitHub Pages, oraz na localhost podczas pracy lokalnej. Nie wymaga serwera logowania. Przeglądarka musi obsługiwać Web Crypto i service workers.

## Co przeniesiono

Z bieżącego publicznego drzewa usunięto i zachowano zaszyfrowane:

- Doom HTML z obrazami i pozostałymi plikami projektu;
- kompilację Unity Geometry Dash Lite z zasobami i wcześniejszym wrapperem;
- starsze gry Tetris, Flappy Bird, Block Blast i Skibidi Fish;
- poprzednie `Logo.png`, `logo.png`, `LogoBack.png`;
- ilustracje katalogowe związane z przeniesionymi grami.

Łącznie: 115 wcześniejszych plików oraz 3 dokumenty do obsługi wewnętrznego katalogu, czyli 118 plików szyfrowanych. Oryginalne ścieżki i sumy kontrolne zachowano w `manifest.json`. Wydzielenie oznacza niepotwierdzone prawa lub potrzebę sprawdzenia pochodzenia, a nie rozstrzygnięcie, że materiał narusza prawa.

Nowe ilustracje i kod oprawy, nowa samodzielna gra Mały lot oraz biblioteki i fonty z dołączonymi licencjami pozostają publiczne. Sam fakt, że materiał podlega prawu autorskiemu, nie oznacza zakazu używania — liczy się posiadane uprawnienie.

## Ochrona

- PBKDF2-HMAC-SHA-256, **600 000 iteracji**, losowa sól **32 bajty**. Hasło jest kodowane dokładnie jako UTF-8, bez obcinania spacji i bez zmiany znaków.
- Wyprowadzane jest 64 bajty: pierwsze 32 stanowią klucz AES-256; SHA-256 z drugiej połowy stanowi weryfikator hasła. Klucz AES nie jest zapisywany w metadanych.
- Każdy plik jest szyfrowany osobno przez **AES-256-GCM**, z osobnym losowym 12-bajtowym IV i 128-bitowym tagiem uwierzytelnienia. Nazwa pliku stanowi dodatkowe dane uwierzytelniane, więc zamiana szyfrogramów między ścieżkami nie daje poprawnego dokumentu.
- W `data/*.enc` znajdują się wyłącznie IV i szyfrogram z tagiem. `manifest.json` zawiera sól, weryfikator, parametry, nazwy, rozmiary i sumy kontrolne. Lista nazw nie jest ukrywana.
- Formularz nie jest jedyną bramką: service worker sprawdza klucz, faktycznie odszyfrowując dokument z poprawnym tagiem GCM. Podmienienie interfejsu lub wysłanie fałszywego polecenia „UNLOCK” nie odszyfruje plików.
- Klucz nie jest eksportowalny i pozostaje w pamięci service workera. Nie zapisujemy go ani hasła w cookies, localStorage, sessionStorage, IndexedDB, Cache API lub plikach. Odszyfrowane odpowiedzi mają `Cache-Control: no-store`.
- Przycisk „Zablokuj”, odświeżenie i opuszczenie bramki zamykają dostęp. Worker dodatkowo sprawdza, czy karta bramki nadal istnieje. Sesja ma bezwzględny limit **30 minut**. Obowiązuje jedna aktywna sesja archiwum w danym kontekście przeglądarki; ponowne otwarcie bramki blokuje wcześniejszą sesję.
- Przed uruchomieniem service workera adresy `others/content/...` nie istnieją na serwerze. Po uruchomieniu, ale bez odblokowania, zwracają 401. Pliki `.enc` można pobrać, lecz bez hasła nie są jawne.
- Prywatne odpowiedzi mają dodatkową CSP blokującą zewnętrzne połączenia. Strony archiwum mają `noindex`; `robots.txt` wyłącza indeksowanie `/others/`. To dodatkowe wskazówki dla robotów, nie mechanizm kontroli dostępu.

Osoba znająca hasło może zapisać odszyfrowane materiały. Nie jest to DRM. Na statycznym hostingu nie ma również serwerowego ograniczania prób — posiadacz szyfrogramów może próbować odgadywać hasło offline, ponosząc koszt PBKDF2.

## Weryfikacja i odzyskanie plików

Narzędzie wymaga biblioteki Python `cryptography` (dostępna w przygotowanym środowisku). Hasło podaje się w ukrytym wejściu terminala; nie jest argumentem wiersza poleceń i nie jest zapisane w skrypcie.

```sh
python3 scripts/others_archive.py verify
python3 scripts/others_archive.py restore --destination /tmp/spinner-others-restored
```

`verify` odszyfrowuje wszystkie pliki w pamięci i sprawdza tagi oraz sumy SHA-256. `restore` odtwarza je do nowego katalogu **poza publikowanym checkoutem** i nigdy nie nadpisuje istniejącego katalogu. Nie należy publikować odtworzonych jawnych plików. Pierwsze pakowanie wykonano przez `pack --remove-sources`; przed usunięciem źródeł porównano każdy odszyfrowany plik bajt po bajcie i sprawdzono, czy źródła nie uległy zmianie.

Testy automatyczne używają odrębnego tymczasowego archiwum z publicznym hasłem testowym, niezwiązanym z hasłem tego archiwum:

```sh
python3 tests/test_others.py
```

## Czego ta zmiana nie robi

Nie usuwa plików z historii Git, poprzednich wdrożeń, kopii, cache innych usług ani klonów repozytorium. Publiczne repozytorium mogło już udostępnić starsze materiały. Archiwizer nie przepisuje historii Git. Wdrożenie zmienionego drzewa usuwa jawne pliki z bieżącego serwisu, lecz nie usuwa ich wcześniej opublikowanych kopii.

Szyfrowanie i hasło nie zastępują licencji i nie rozstrzygają legalności przechowywania ani udostępniania materiałów. Przed dalszym wykorzystaniem wyjaśnij pochodzenie zasobów opisanych w [liście praw](../docs/PRAWA-DO-MATERIALOW.md).
