# Spinner Games

Statyczny salon gier w HTML, CSS i JavaScript. Własne ilustracje wektorowe, fonty serwowane lokalnie, katalog z wyszukiwaniem, ulubione, opcjonalny zapis lokalny i konto Firebase Authentication. Bez reklam i analityki.

Uruchom serwer z katalogu repozytorium:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Testy przeglądarkowe (Python Playwright i Chromium):

```sh
python3 tests/smoke.py
python3 tests/test_others.py
python3 tests/test_new_games.py
python3 tests/test_more_games.py
python3 tests/test_thirty_games.py
python3 tests/test_hundred_games.py
python3 tests/test_compass.py
python3 tests/test_viewport.py
python3 tests/test_player_integration.py
```

- [Uruchomienie, Firebase, zakres testów i działania przed publikacją](docs/URUCHOMIENIE-I-BEZPIECZENSTWO.md)
- [Przegląd i ulepszenia każdej gry, mechaniki oraz testy](docs/PRZEGLAD-GIER.md)
- [Pięć nowych gier — funkcje i weryfikacja](docs/NOWE-GRY.md)
- [Sto pozycji, 40 nowości i kompas polityczny](docs/100-GIER-I-KOMPAS.md)
- [Kolejnych 30 gier i plansza razem ze sterowaniem](docs/30-NOWYCH-GIER-I-EKRAN.md)
- [Kolejnych 17 gier — zasady, sterowanie i testy](docs/17-NOWYCH-GIER.md)
- [Lista materiałów wymagających wyjaśnienia praw](docs/PRAWA-DO-MATERIALOW.md)
- `assets/catalog.js` — opis i lista gier.
- `assets/site.css`, `assets/art/` — oprawa serwisu.
- `assets/storage.js` — wybór zgód i zapis preferencji.
- `assets/auth.js` — konto; bez odczytu historycznej bazy nicków.

Materiały do weryfikacji wydzielono do szyfrowanego [others](others/README.md), dostępnego przez `others/index.html`. Publiczny katalog ma 100 pozycji, w tym 39 kolejnych gier oraz edukacyjny kompas polityczny opisane w [dokumentacji](docs/100-GIER-I-KOMPAS.md). Wyniki kompasu pozostają w pamięci karty; porównania partii są jawnie opisanym modelem orientacyjnym z punktem odniesienia 2023, nie aktualnym przeglądem programów. Starsze pliki są dostępne wyłącznie po odszyfrowaniu w bieżącym drzewie, ale mogą nadal znajdować się w historii Git i poprzednich publikacjach. Nowa oprawa nie potwierdza praw do dawnych zasobów ani akceptacji przez Google.

Podglądy: [komputer](docs/screenshots/desktop.png), [telefon](docs/screenshots/mobile.png), [ekran gry](docs/screenshots/game-mobile.png).
