# Kolejnych 30 gier i rozgrywka na jednym ekranie

Katalog rozszerzono z 30 do **60 gier** (40 logicznych, 20 zręcznościowych). Każda nowa pozycja ma lokalną implementację, własne ilustracje SVG i zasady dostępne w odtwarzaczu. Nie pobierano zewnętrznych kompilacji, sprite’ów ani silników. Gry działają bez konta i bez reklam; wyszukiwarka uwzględnia również identyfikatory, np. `futoshiki` i `freecell`.

## Plansza razem ze sterowaniem

Odtwarzacz `gra.html` zajmuje dostępną wysokość okna. Wąski nagłówek zawiera powrót do katalogu, nazwę gry, motyw, restart, pełny ekran, zasady i prywatność. Ramka gry zachowuje wysokość wolnego miejsca. Zgłoszenie dużej wysokości zawartości nie rozciąga strony.

`assets/game-viewport.js` układa istniejące, rzeczywiste elementy gry w pięciu obszarach: wynik, przyciski akcji, plansza, sterowanie i komunikat. W pionie przyciski są pod planszą, w niskim poziomym oknie obok niej. Rozmiar planszy wynika z dostępnego miejsca i jej proporcji; nie pomniejszamy całej strony transformacją. Ustawienia i dłuższe opisy są w otwieranym panelu **Opcje**. Zachowano ich wartości, identyfikatory i obsługę zdarzeń. Zmiana rozmiaru ani motywu nie losuje nowej rundy.

Poprawka obejmuje wszystkie 60 publicznych gier, zarówno w odtwarzaczu, jak i po otwarciu osobno. Saper wylicza rozmiar pól z wysokości i szerokości. Memory uwzględnia liczbę kart. Sudoku zachowuje klawiaturę cyfrową, a gry kierunkowe mają dostępne przyciski przy widocznej górnej krawędzi planszy. Dotyk uruchamia ruch przy naciśnięciu. Pauza anuluje trwające przytrzymanie i przeciąganie; zamknięcie panelu klawiszem Escape nie wznawia rundy.

Chronione gry Tetris, Flappy Bird, Block Blast, Doom HTML i wrapper Unity otrzymują ten sam układ przez współdzielone zasoby. Archiwalny odtwarzacz jest dostosowywany podczas uruchamiania. Sesja archiwum mieści się w oknie, a sceny Dooma mają obraz i przyciski kierunków na jednym ekranie. Pełny ekran Unity zachowuje przycisk dotykowy. Szyfrogramy, hasło, sól i sposób uwierzytelniania archiwum pozostają niezmienione; nie publikowano odtworzonych źródeł.

## Nowe gry

| Gra              | Identyfikator w `gra.html?gra=…` | Rozgrywka                                                                                                                                                                                                                                     |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warcaby          | `checkers`                       | Warcaby angielskie na planszy 8 × 8: bicie jest obowiązkowe, także wielokrotne. Zwykłe pionki idą i biją do przodu; damki poruszają się o jedno pole w obu kierunkach. Awans kończy turę. Komputer lub dwie osoby.                            |
| Mosty Hex        | `hex`                            | Gracz I łączy lewy i prawy brzeg, gracz II górny i dolny. Łańcuch składa się z sąsiednich pól. Plansza 7 × 7, komputer lub lokalna gra we dwoje, cofanie.                                                                                     |
| Młynek           | `morris`                         | Najpierw ustaw po dziewięć pionków na 24 polach. Potem przesuwaj je po liniach; trzy pozostałe pionki mogą skakać. Trzy w jednej linii pozwalają zdjąć pionek rywala spoza młynka, chyba że wszystkie są w młynkach. Komputer lub dwie osoby. |
| Okręty           | `battleships`                    | Odszukaj flotę komputera na planszy 8 × 8. Każda strona ma okręty długości 4, 3, 3 i 2 bez stykania. Twój przeciwnik szuka sąsiadów trafienia. Floty są losowane przed rundą.                                                                 |
| Domino           | `domino`                         | Graj zestawem podwójna szóstka przeciw komputerowi. Dopasowuj kostkę do końca łańcucha. Gdy nie masz ruchu, dobierz kostkę; po wyczerpaniu stosu pasuj. Wygrywa pusta ręka lub niższa suma oczek przy blokadzie.                              |
| Pasjans          | `solitaire`                      | Klasyczny pasjans Klondike: siedem kolumn, dobieranie po jednej karcie, cztery fundamenty od asa. Kolumny maleją z naprzemiennymi kolorami, na puste miejsce wchodzi król. Możesz przenosić odkryte sekwencje i cofać ruchy.                  |
| Wolne komórki    | `freecell`                       | Ułóż karty na czterech fundamentach od asa. W ośmiu kolumnach buduj malejąco, naprzemiennymi kolorami. Cztery wolne komórki mieszczą po jednej karcie. Wielkość przenoszonej sekwencji zależy od wolnych komórek i kolumn.                    |
| Golf karciany    | `golf`                           | Usuwaj wierzchnie karty z siedmiu kolumn, jeśli ich wartość różni się o jeden od karty bazowej. As i król nie są sąsiadami. Gdy utkniesz, dobierz ze stosu. Oczyść 35 kart, zanim skończy się talia.                                          |
| Kości            | `dice`                           | Pięć kości, do trzech rzutów w turze i trzynaście kategorii. Zatrzymuj wybrane kości. Wybór wyniku zamyka kategorię; górna sekcja daje 35 premii po zebraniu 63 punktów. Wszystkie wyniki są liczone z rzeczywistego układu.                  |
| Nim              | `nim`                            | W turze zabierz dowolną dodatnią liczbę kamieni z jednego stosu. Wygrywa osoba zabierająca ostatni. Trzy stosy i komputer korzystający z sumy nimowej lub gra we dwoje.                                                                       |
| Ostatni kęs      | `chomp`                          | Wybierając pole, zjadasz także wszystkie pola na prawo i poniżej. Lewy górny kawałek jest zatruty: kto go weźmie, przegrywa. Komputer lub dwie osoby, cofanie i podgląd wybranego cięcia.                                                     |
| Amazonki         | `amazons`                        | Dwie amazonki na stronę na planszy 6 × 6. Przesuń amazonkę jak królową szachową, potem wystrzel z jej nowego pola strzałę w linii prostej. Strzała zamyka pole na stałe. Przegrywa gracz bez ruchu. Komputer lub dwie osoby.                  |
| Równowaga        | `takuzu`                         | Uzupełnij planszę 6 × 6. Każdy wiersz i kolumna ma po trzy zera i jedynki. Trzy takie same znaki obok siebie są zabronione, a dwa wiersze lub kolumny nie mogą być identyczne. Stałe pola pozostają zablokowane.                              |
| Mniejsze większe | `futoshiki`                      | Wpisz 1–5 po razie w każdym wierszu i kolumnie. Pomiędzy polami znajdują się znaki mniejsze i większe. Spełnij wszystkie nierówności. Dostępne są cofanie i sprawdzenie konfliktów.                                                           |
| Wieżowce         | `skyscrapers`                    | Wpisz wysokości 1–5 po razie w każdym wierszu i kolumnie. Liczby na brzegach mówią, ile budynków widać z danej strony — wyższy zasłania niższe stojące za nim.                                                                                |
| Klatki liczbowe  | `cages`                          | Wpisz 1–4 po razie w wierszach i kolumnach. Każda zaznaczona klatka ma działanie i wynik. Spełnij jednocześnie warunki klatek oraz planszy. Układy i podziały są generowane lokalnie.                                                         |
| Prostokąty       | `shikaku`                        | Podziel planszę 6 × 6 na prostokąty. Każdy zawiera dokładnie jedną liczbę, która oznacza jego pole. Prostokąty nie mogą się nakładać. Zaznacz przeciwległe narożniki; cofanie pomaga poprawić podział.                                        |
| Wyspy i mosty    | `bridges`                        | Łącz sąsiednie wyspy jednym albo dwoma mostami. Liczba na wyspie określa sumę dochodzących mostów. Wszystkie wyspy muszą tworzyć jedną sieć. Mosty prowadzą tylko po liniach między sąsiadami i nie krzyżują się.                             |
| Rozplącz         | `untangle`                       | Przesuwaj dziewięć wierzchołków, aż żadne dwie krawędzie nie będą się przecinać. Przecięcie we wspólnym końcu jest dozwolone. Każdy graf ma przygotowane płaskie ułożenie.                                                                    |
| Zamknij pętlę    | `loop`                           | Zaznacz jedną zamkniętą pętlę po krawędziach pól. Liczba w polu mówi, ile jego boków należy do pętli. Rozgałęzienia i oddzielne pętle są zabronione. Układy powstają z zamkniętej granicy własnych figur.                                     |
| Najeźdźcy        | `invaders`                       | Przesuwaj statek, trafiaj formację i unikaj pocisków. Trzy fale, trzy osłony, coraz szybsza formacja i krótka ochrona po trafieniu. Własne geometryczne statki i lokalny silnik.                                                              |
| Przeprawa        | `crossing`                       | Przejdź między pojazdami i przepłyń rzekę na belkach. Zajmij trzy różne miejsca na drugim brzegu. Masz trzy próby, a każda przeprawa ma własny limit czasu.                                                                                   |
| Zakręt           | `racer`                          | Dotrzyj do mety, omijając ruch drogowy i zbierając paliwo. Zmieniaj pasy bez opóźnienia. Zderzenie zużywa osłonę, a pusty bak kończy przejazd. Trzy osłony i trasa 3000 metrów.                                                               |
| Platformy        | `platformer`                     | Przejdź trzy własne etapy, zbierz klucze i wejdź do drzwi. Fizyka uwzględnia krótki bufor skoku i tolerancję zejścia z krawędzi. Przeszkody są stałe, a strata próby odtwarza ten sam etap.                                                   |
| Lądownik         | `lander`                         | Wyląduj na trzech lądowiskach. Steruj obrotem i silnikiem, pilnując paliwa. Bezpieczne lądowanie wymaga małego przechyłu oraz małej prędkości; wskaźniki pokazują aktualny stan.                                                              |
| Flipper          | `pinball`                        | Odbijaj piłkę dwiema łapkami, trafiaj zderzaki i cele u góry stołu. Masz trzy piłki. Łapki przekazują impuls zależny od ruchu, a fizyka działa stałym krokiem czasu.                                                                          |
| Łucznik          | `archery`                        | Oddaj dziesięć strzałów do poruszającej się tarczy. Ustaw kąt i siłę, uwzględnij grawitację oraz wiatr. Punkty zależą od odległości od środka tarczy w chwili trafienia.                                                                      |
| Bilard           | `billiards`                      | Wbij sześć kolorowych bil w dziesięciu uderzeniach. Biała bila przekazuje pęd przy zderzeniu, bandy odbijają, a tarcie zatrzymuje ruch. Wpadnięcie białej kosztuje dodatkową próbę.                                                           |
| Cztery takty     | `rhythm`                         | Cztery tory i autorska sekwencja rytmiczna. Uderzaj, kiedy znaczniki przechodzą przez linię. Trafienie ma okno 140 ms; dokładność buduje serię. Dwa tempa i 30-sekundowa runda. Gra działa bez dźwięku.                                       |
| Balans           | `balance`                        | Przechylaj belkę i prowadź kulkę do ośmiu kolejnych znaczników. Uważaj na bezwładność i końce belki. Masz minutę; nadmierne wychylenie pozwala kulce wypaść.                                                                                  |

Każda implementacja ma nową rundę, wynik, pauzę, klawiaturę i obsługę telefonu. Odrębne reguły znajdują się w `assets/game-{id}.js`. Gry karciane współdzielą obsługę kart w `assets/thirty-cards.js`, a trzy łamigłówki łacińskie wspólny edytor w `assets/thirty-latin.js`; warunki zwycięstwa i ograniczenia pozostają odrębne. Drobne funkcje są w `assets/thirty-tools.js`. Fizyka korzysta ze stałego kroku 1/120 sekundy. Ilustracje znajdują się w `assets/art/{id}.svg`.

Dla plansz losowanych z poprawnego rozwiązania gra sprawdza wszystkie reguły, a nie tylko zgodność z ukrytym wzorem. Nie obiecujemy unikalności rozwiązań Równowagi, Mniejsze większe, Wieżowców, Klatek, Prostokątów, Wysp ani Pętli. Losowe rozdania pasjansa i FreeCell również nie mają gwarancji wygranej.

Rekordy używają `SpinnerStorage.preferences`. Bez opcjonalnej zgody działają w pamięci otwartej strony, po zgodzie mogą być zapamiętane lokalnie. Nie dodano telemetrii, analityki ani nowej kategorii zgód.

## Sprawdzenie

Przeszły **124 scenariusze**:

| Zestaw                             | Liczba | Zakres                                                                                                                                                                                                                                      |
| ---------------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/test_thirty_games.py`       |     34 | Reguły 30 nowych gier, pełne zakończenia, komputer, ruchy i cofanie, fizyka, polskie wskazówki, czas oraz anulowanie przytrzymania i jednoczesne sterowanie dwoma palcami.                                                                  |
| `tests/test_viewport.py`           |      6 | Wszystkie 60 gier przy 320 × 568, 390 × 844, 844 × 390 i 1440 × 900, wszystkie strony osobno przy 390 × 650, widoczne powierzchnie gry i przyciski, zero przewijania dokumentu, pełny ekran, aktywny Snake, panel opcji i zachowanie stanu. |
| `tests/test_new_games.py`          |     17 | Poprzednie 2048, Memory, Paletka, Sudoku i Skrzynki.                                                                                                                                                                                        |
| `tests/test_more_games.py`         |     26 | Poprzednie 17 gier, ich zasady, rekordy i pauza.                                                                                                                                                                                            |
| `tests/smoke.py`                   |     12 | Wszystkie 60 pozycji, oba motywy, brak zewnętrznych żądań, zgody, konto z symulowanym HTTP Firebase.                                                                                                                                        |
| `tests/test_player_integration.py` |      4 | Rzeczywisty odtwarzacz, ponowienie błędu, zatrzymywanie przez panele i przekazanie usunięcia preferencji.                                                                                                                                   |
| `tests/test_archive_puzzles.py`    |      7 | Chronione łamigłówki i lot, z odtworzonej kopii poza repozytorium.                                                                                                                                                                          |
| `tests/test_archive_navigation.py` |      8 | Rzeczywisty Doom, pełna misja, WebGL Unity, pauza i obsługa błędów.                                                                                                                                                                         |
| `tests/test_archive_viewport.py`   |      2 | Pięć chronionych gier w pionie i poziomie oraz obraz i kierunki w scenie Dooma.                                                                                                                                                             |
| `tests/test_others.py`             |      8 | Osobne archiwum testowe: weryfikacja szyfrowania, blokowanie, przeładowanie i aktualizacja.                                                                                                                                                 |

Normalne testy nie zawierają hasła archiwum. Testy prywatnych źródeł wymagają zmiennej `SPINNER_ARCHIVE_SOURCE` wskazującej pełną odtworzoną kopię **poza repozytorium**. Dodatkowo sprawdzono uruchomienie rzeczywistych chronionych gier przez service workera; hasła nie zapisano w kodzie. Kont produkcyjnych nie modyfikowano.

```sh
python3 tests/test_thirty_games.py
python3 tests/test_viewport.py
python3 tests/test_new_games.py
python3 tests/test_more_games.py
python3 tests/smoke.py
python3 tests/test_player_integration.py
python3 tests/test_others.py
# Opcjonalnie, z odtworzonym źródłem poza repozytorium:
SPINNER_ARCHIVE_SOURCE=/outside/checkout/private-copy python3 tests/test_archive_puzzles.py
SPINNER_ARCHIVE_SOURCE=/outside/checkout/private-copy python3 tests/test_archive_navigation.py
SPINNER_ARCHIVE_SOURCE=/outside/checkout/private-copy python3 tests/test_archive_viewport.py
```

Podglądy: [Snake w pionie](screenshots/sixty-games/snake-portrait.png), [Snake w poziomie](screenshots/sixty-games/snake-landscape.png), [Mniejsze większe](screenshots/sixty-games/futoshiki-mobile.png), [Wolne komórki](screenshots/sixty-games/freecell-mobile.png), [Flipper](screenshots/sixty-games/pinball-mobile.png), [Platformy](screenshots/sixty-games/platformer-landscape.png), [Bilard](screenshots/sixty-games/billiards-desktop.png).
