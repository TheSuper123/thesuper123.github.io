# Kolejnych 17 gier

To dokumentacja wcześniejszego etapu. Obecnie katalog ma [100 pozycji i kompas polityczny](100-GIER-I-KOMPAS.md).

Katalog rozszerzono z 13 do **30 gier**: 20 logicznych i 10 zręcznościowych. Poniższe implementacje mają własny kod JavaScript, lokalne wektory SVG i oprawę zgodną z jasnym oraz ciemnym motywem salonu. Nie korzystają z pobranych gier, cudzych sprite'ów, zdalnych silników, reklam ani dodatkowych usług.

| Gra / identyfikator w adresie `gra.html?gra=…` | Zasady i funkcje                                                                                                                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cztery w rzędzie / `connect-four`              | Siedem kolumn, grawitacja, cztery kierunki zwycięstwa; komputer z przeszukiwaniem drzewa i dwoma poziomami lub lokalna gra we dwoje; cofanie odpowiedzi komputera.                                                   |
| Reversi / `reversi`                            | Odwracanie krążków w ośmiu kierunkach, wskazywanie legalnych pól, automatyczne przekazanie kolejki bez ruchu, poprawny koniec przy braku ruchów obu stron; komputer lub dwie osoby.                                  |
| Kropki i kreski / `dots-boxes`                 | Dziewięć kwadratów między 16 kropkami; dodatkowy ruch po domknięciu, liczenie właścicieli pól; komputer lub dwie osoby. Kreski mają osobne obszary dotknięcia.                                                       |
| Kalaha / `mancala`                             | 48 kamieni, rozsiewanie z pomijaniem magazynu rywala, przejęcia, dodatkowe tury i zebranie końcówki; komputer lub dwie osoby.                                                                                        |
| Piętnastka / `fifteen`                         | Plansza 3 × 3 lub 4 × 4, losowanie legalnymi ruchami, cofnięcie i powtórzenie układu. Wskazówka używa odległości kafelków od celu; nie obiecuje najkrótszego rozwiązania.                                            |
| Zgaś światła / `lights-out`                    | Plansze 4 × 4 i 5 × 5, odwracanie pola z sąsiadami, generator rozwiązywalnych stanów, cofnięcie. Podpowiedź rozwiązuje bieżący układ przez eliminację w GF(2).                                                       |
| Nonogram / `nonogram`                          | Osiem własnych obrazków 5 × 5 i 8 × 8; wskazówki wierszy i kolumn, oznaczanie pustych pól prawym przyciskiem lub przełącznikiem mobilnym, cofnięcie. Gra akceptuje każdy układ spełniający podane liczby.            |
| Wieże Hanoi / `hanoi`                          | Od 3 do 7 krążków, sprawdzanie legalności, minimum od startu, cofanie i poprawna wskazówka także po odejściu od optymalnej drogi.                                                                                    |
| Samotnik / `peg-solitaire`                     | 8, 12 lub 20 pionków na krzyżu; generator przez odwracanie skoków i sprawdzona konstrukcja awaryjna dla nietypowego generatora liczb losowych. Każdy start ma certyfikat rozwiązania. Cofanie i powtórzenie planszy. |
| Łamacz kodu / `codebreaker`                    | Cztery cyfry z zakresu 1–6, powtórzenia, dziesięć prób, oddzielne trafienia miejsca i cyfry bez podwójnego liczenia, historia i obsługa klawiaturą.                                                                  |
| Wykreślanka / `word-search`                    | Osiem słów na planszy 10 × 10, trzy własne zestawy polskich słów, osiem kierunków, dowolna kolejność wyboru końców, wskazanie początku.                                                                              |
| Litera po literze / `word-guess`               | Polski alfabet, trzy kategorie i 30 własnych haseł, siedem pomyłek, brak kary za powtórzenie litery i seria zwycięstw. Litera P pozostaje literą; pauza działa pod Escape.                                           |
| Echo / `echo`                                  | Coraz dłuższa sekwencja czterech pól, dwa tempa, zegar pokazu zatrzymywany przez pauzę, rekord długości; cel 15 serii.                                                                                               |
| Kretowisko / `moles`                           | 30 sekund, dwa tempa, serie i mnożnik, kary za kamienie i puste pola, natychmiastowe trafienie przy naciśnięciu. Zegar zatrzymuje się w pauzie.                                                                      |
| Pojedynek / `pong`                             | Mecz do siedmiu punktów przeciw komputerowi na trzech poziomach; kąt odbicia od paletki, przyspieszenie piłki, osobny serwis, klawiatura i bezpośrednie sterowanie palcem.                                           |
| Orbita / `orbit`                               | Statek z bezwładnością, obrót i ciąg, strzelanie, zawijanie współrzędnych, duże skały dzielone na mniejsze, trzy osłony z ochroną po zderzeniu i trzy fale do ukończenia.                                            |
| Wieża / `stack`                                | Ruchomy klocek, odcinanie wystającej części, premia za dokładność, rosnąca szybkość, przesuwanie widoku i cel 25 pięter. Dotyk reaguje przy naciśnięciu.                                                             |

Gry działają bez konta. Mają klawiaturę i sterowanie dotykowe, nową rundę, wynik oraz pauzę reagującą na utratę widoczności, przełączenie okna i panele strony. Wznowienie wymaga działania gracza. Przyciski przytrzymywane i zaznaczenie słowa nie wykonują zaległych ruchów po pauzie. Zmiana motywu nie rozpoczyna gry od nowa.

Fizyka trzech gier canvas działa ze stałym krokiem 1/120 s przez `requestAnimationFrame`. Plansze logiczne nie uruchamiają pętli rysowania. Wspólna oprawa i wejście są w `assets/more-game-tools.js` oraz `assets/more-games.css`, obsługa tur w `assets/more-board-ai.js`, a odrębne reguły w `assets/game-{identyfikator}.js`. Strony `games/{identyfikator}.html` działają samodzielnie i w odtwarzaczu.

Rekordy używają istniejącego `SpinnerStorage.preferences`: bez zgody pozostają w pamięci otwartej strony, po zgodzie mogą przetrwać jej odświeżenie. Wycofanie zapisu usuwa je i odświeża widok rekordu. Nie dodano nowych kategorii zgód. Materiały archiwalne w `others` nie są potrzebne do uruchomienia tych gier.

## Weryfikacja

```sh
python3 tests/test_more_games.py
python3 tests/test_new_games.py
python3 tests/smoke.py
```

26 nowych scenariuszy sprawdza pełne zakończenia rund wszystkich nowych gier, legalne certyfikaty, powtarzające się cyfry, przejęcia i dodatkowe tury, blokowanie wygranej przez komputer, cofanie, klawiaturę i naciśnięcie przed puszczeniem palca. Testy zegara instalują czas wirtualny przed załadowaniem silników. Obejmują pauzę w trakcie pokazu, oczekiwanie komputera, fizykę w ruchu, anulowanie przytrzymania, rekordy z odmową i przyznaniem zgody oraz czyszczenie danych.

Każda z 17 stron przechodzi sprawdzenie w odtwarzaczu przy szerokościach 320, 390 i 1440 px w obu motywach. Testy wykrywają błędy JavaScript, niedostępne lokalne pliki i zewnętrzne żądania sieciowe. Test ogólny ładuje wszystkie 30 pozycji katalogu. Wcześniejsze 17 scenariuszy pięciu gier oraz 12 testów całego serwisu uzupełniają nowy zestaw. Łącznie przeszło **55 scenariuszy**.

Podglądy: [Cztery w rzędzie](screenshots/more-games/connect-four.png), [Kropki i kreski na telefonie](screenshots/more-games/dots-boxes-mobile.png), [Nonogram w ciemnym motywie](screenshots/more-games/nonogram-mobile-dark.png), [Orbita](screenshots/more-games/orbit-dark.png), [Wieża](screenshots/more-games/stack-mobile.png).
