# Pięć nowych gier

Publiczny katalog ma teraz 13 pozycji. Dodano pięć własnych implementacji bez zewnętrznych silników, pobranych grafik, kont i połączeń sieciowych podczas rozgrywki.

| Gra | Rozgrywka i funkcje |
| --- | --- |
| 2048 | Jednokrotne łączenie kafelka w ruchu, prawidłowe wykrywanie końca gry, kontynuacja po osiągnięciu celu, cofnięcie, klawiatura, przyciski i gesty. |
| Memory | Własne znaki wektorowe, 6/8/12 par, licznik prób i aktywnego czasu, ochrona przed trzecim odkryciem oraz rekordy osobne dla rozmiaru. |
| Paletka | Trzy układy cegieł, trzy tempa, mocniejsze cegły, trzy piłki, sterowanie kątem odbicia oraz fizyka ze stałym krokiem 240 Hz. |
| Sudoku | Własny generator sprawdzający jedno rozwiązanie, trzy poziomy, notatki, cofnięcie, wskazywanie konfliktów, sprawdzanie i podpowiedzi. Rekord czasu dotyczy gry bez pomocy. |
| Skrzynki | Osiem własnych magazynów, gwarantowana rozwiązywalność początkowych układów przez odwracanie ruchów, licznik kroków i pchnięć, cofanie oraz ostrzeżenie o skrzyni w narożniku. |

Każda gra ma jasny i ciemny motyw, sterowanie mobilne i klawiaturą oraz idempotentną pauzę zgodną z otwieraniem paneli strony. Zamknięcie panelu nie wznawia rozgrywki samoczynnie. Rekordy są przechowywane przez `SpinnerStorage.preferences`: bez opcjonalnej zgody tylko w pamięci strony, po zgodzie na urządzeniu. Nie dodano nowych kategorii zgód ani zewnętrznych usług.

Strony są w `games/{2048,memory,breakout,sudoku,sokoban}.html`, silniki w odpowiadających im `assets/game-*.js`, wspólne drobne funkcje w `assets/new-game-tools.js`, a style w `assets/new-games.css`. Pięć ilustracji SVG w `assets/art/` jest własnymi rysunkami; nie są to pobrane okładki gier.

## Sprawdzenie

```sh
python3 tests/test_new_games.py
python3 tests/smoke.py
```

Przeszło **29 testów**: 17 nowych scenariuszy oraz 12 testów całego serwisu, które obejmują już wszystkie 13 gier. Nowe testy sprawdzają m.in. wejście przed puszczeniem przycisku, ukończenie całej talii Memory i Sudoku rzeczywistymi klawiszami, poprawność certyfikatów wszystkich magazynów, ukończenie trzech ścian Paletki normalnym kontrolerem, fizykę przy 30 i 144 FPS, pauzę, rekordy i zgody oraz oba motywy w szerokościach 320, 390 i 1280 px.

Odtworzenie prywatnego archiwum nie jest potrzebne do testowania tych gier. Istniejące pliki i ochrona `others` pozostały poza zakresem zmiany.

Podglądy: [2048](screenshots/new-games/2048.png), [Memory](screenshots/new-games/memory.png), [Paletka](screenshots/new-games/breakout.png), [Sudoku](screenshots/new-games/sudoku.png), [Skrzynki](screenshots/new-games/sokoban.png).
