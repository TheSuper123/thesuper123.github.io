# Sto gier i testów

Katalog rozszerzono z 60 do **100 pozycji**: 64 logiczne, 31 zręcznościowych i 5 w nowej kategorii **Quizy i testy**. To 39 nowych gier oraz edukacyjny kompas polityczny. Każda pozycja ma lokalną implementację, opis zasad, własny rysunek SVG, jasny i ciemny motyw oraz układ planszy i sterowania mieszczący się w oknie. Nie dodano reklam, analityki ani zewnętrznego silnika gier.

## Nowe pozycje

|  Nr | Nazwa             | Identyfikator       | Zasada                                         |
| --: | ----------------- | ------------------- | ---------------------------------------------- |
|  61 | Szachy            | `chess`             | Cała partia, od pierwszego ruchu do mata.      |
|  62 | Go                | `go`                | Małe kamienie, duże terytorium.                |
|  63 | Tryktrak          | `backgammon`        | Kości wyznaczają ruch. Ty wybierasz plan.      |
|  64 | Obróć pięć        | `pentago`           | Jeden kamień i jeden obrót zmieniają wszystko. |
|  65 | Gomoku            | `gomoku`            | Zostaw rywalowi o jeden ruch za mało.          |
|  66 | Ataxx             | `ataxx`             | Mały krok zostawia więcej Twoich pionków.      |
|  67 | Konane            | `konane`            | Na końcu przegrywa ten, kto nie ma skoku.      |
|  68 | Lis i gęsi        | `fox-geese`         | Sprytny lis albo dobrze ustawione stado.       |
|  69 | Kakuro            | `kakuro`            | Każda strzałka prowadzi do jednej sumy.        |
|  70 | Nurikabe          | `nurikabe`          | Oddziel wyspy jednym czarnym morzem.           |
|  71 | Kuromasu          | `kuromasu`          | Policz to, co widać aż do czarnego pola.       |
|  72 | Hitori            | `hitori`            | Zostaw liczby i wolne przejście.               |
|  73 | Gwiezdne regiony  | `star-battle`       | Sześć gwiazd, trzy warunki naraz.              |
|  74 | Namioty           | `tents`             | Każde drzewo czeka na własny namiot.           |
|  75 | Ukryta flota      | `fleet-puzzle`      | Dziewięć pokładów do odnalezienia.             |
|  76 | Latarnie          | `akari`             | Rozświetl każde białe pole.                    |
|  77 | Rurociąg          | `netwalk`           | Ćwierć obrotu bliżej źródła.                   |
|  78 | Wyjazd            | `rush-hour`         | Czerwony chce już wyjechać.                    |
|  79 | Droga skoczka     | `knight-tour`       | Wszędzie dokładnie raz.                        |
|  80 | Osiem hetmanów    | `eight-queens`      | Osiem figur, żadnego ataku.                    |
|  81 | Sześć ścieżek     | `paths`             | Każda cyfra musi znaleźć drugą.                |
|  82 | Pięć pól          | `polyomino`         | Obróć, odbij, dopasuj.                         |
|  83 | Dokładnie 24      | `twenty-four`       | Cztery liczby i właściwe nawiasy.              |
|  84 | Szyfrogram        | `cryptogram`        | Każdy znak skrywa jedną literę.                |
|  85 | Maszynopis        | `typing`            | Dokładność przed pośpiechem.                   |
|  86 | Kolor słowa       | `stroop`            | Czytasz słowo czy widzisz kolor?               |
|  87 | Rachunek w głowie | `mental-math`       | Najpierw wynik, potem rekord tempa.            |
|  88 | Stolice           | `capitals`          | Australia? To nie Sydney.                      |
|  89 | Pas asteroid      | `asteroids`         | Wyhamuj, obróć, zrób przejście.                |
|  90 | Artyleria         | `artillery`         | Wiatr przestawia każdy plan.                   |
|  91 | Curling           | `curling`           | Jeszcze odrobinę szczotkowania.                |
|  92 | Minigolf          | `minigolf`          | Dobry bank oszczędza uderzenie.                |
|  93 | Kręgle            | `bowling`           | Pierwszy kręg pociąga resztę.                  |
|  94 | Rzutki 501        | `darts`             | Trzy lotki i trochę liczenia.                  |
|  95 | Jaskinia          | `helicopter`        | Nie puszczaj za wcześnie.                      |
|  96 | Obrona trasy      | `tower-defense`     | Rozstaw obronę, zanim nadejdą.                 |
|  97 | Na ryby           | `fishing`           | Branie to dopiero początek.                    |
|  98 | Slalom            | `skiing`            | Wejdź w skręt przed tyczką.                    |
|  99 | Siatkówka         | `volleyball`        | Skocz, zanim piłka Cię minie.                  |
| 100 | Kompas polityczny | `political-compass` | Zobacz pozycję. Poznaj różnice.                |

Gry planszowe mają komputer lub lokalny tryb dla dwóch osób, poza Artylerią i Rzutkami, które są lokalnymi pojedynkami. Siatkówka ma przeciwnika komputerowego. Cofanie jest dostępne w grach planszowych i łamigłówkach. Pauza blokuje rozgrywkę oraz anuluje przytrzymywanie; suwaki gier fizycznych wracają do wartości nowej rundy.

## Kompas polityczny

Adres: `gra.html?gra=political-compass`. Trzydzieści autorskich stwierdzeń mierzy pięć osi: gospodarkę, władzę i swobody, obyczaje, integrację europejską oraz tempo transformacji klimatycznej. Każda oś ma sześć pytań: trzy w dodatnim i trzy w ujemnym kierunku.

Odpowiedzi mają wartości −2, −1, 0, +1, +2. **Neutralnie** jest rzeczywistym zerem, **Pomiń / nie wiem** nie wchodzi do średniej. Oś ma wynik dopiero po uzyskaniu odpowiedzi, a cały rezultat wymaga minimum trzech odpowiedzi w każdej osi. Brakujące odpowiedzi prowadzą do panelu uzupełnienia, bez pozornego wyniku z zer. Można wracać do pytań i zmieniać odpowiedzi; wynik jest obliczany od nowa.

`wynik osi = 10 × suma(odpowiedź × kierunek pytania) / (2 × liczba odpowiedzi w osi)`

Wyniki mieszczą się od −10 do +10. Wykres pokazuje gospodarkę poziomo (redystrybucja → wolny rynek) oraz władzę i swobody pionowo (na górze większe uprawnienia władzy, na dole swobody). Pięć skal jest dostępnych osobno. Porównanie partii i nurtów używa **wszystkich pięciu osi z taką samą wagą**:

`odległość = sqrt(suma((wynik osi − współrzędna modelu)²) / 5)`

`podobieństwo modelowe = 100 × (1 − odległość / 20)`

To nie jest procent poparcia, prawdopodobieństwo głosu, diagnoza psychologiczna ani rekomendacja wyborcza. Pytania i profile nie były walidowane psychometrycznie. Niewielkie różnice nie uzasadniają rozstrzygającego rankingu. Przy wynikach bliskich zeru opis wskazuje profil centrowy lub mieszany zamiast narzucania pojedynczej tożsamości.

Dziewięć opisanych nurtów i osiem profili partii jest jawnych w [compass-data.js](../assets/compass-data.js) oraz w panelu **Metoda**. Profile dotyczą PiS, PO, Nowej Lewicy, Razem, PSL, Polski 2050, Nowej Nadziei i Ruchu Narodowego. PO nie jest utożsamiana z całą KO, PSL z dawną Trzecią Drogą, a Nowa Nadzieja ze wszystkimi środowiskami Konfederacji.

**Zakres czasowy:** profile to autorski model orientacyjny z punktem odniesienia w kampanii 2023, nie aktualny przegląd programów. Nie sprawdzono zmian po 2023 r. Współrzędne są interpretacją redakcyjną, a nie danymi dostarczonymi przez partie czy wynikiem pomiaru ich programów. Próba sprawdzenia oficjalnych stron w tym środowisku została zablokowana odpowiedzią proxy HTTP 403; nie przedstawiamy jej jako weryfikacji źródeł. Linki do oficjalnych stron w wynikach służą samodzielnemu sprawdzeniu obecnych stanowisk. Nie pobieramy ich w tle; nie używamy logotypów ani zdjęć polityków.

Odpowiedzi i wynik istnieją **wyłącznie w pamięci karty**. Nie trafiają do cookies, localStorage, sessionStorage, Firebase ani analityki, również po zgodzie na opcjonalny zapis preferencji. Kompas pomija historię ostatnio granych. Odświeżenie strony lub **Wyczyść wynik** usuwa odpowiedzi. Dopiero świadome wybranie **Pobierz wynik** tworzy lokalny plik JSON. Otwarcie zewnętrznego linku jest oddzielną decyzją użytkownika, z `noopener noreferrer`. Zaktualizowano politykę prywatności.

## Implementacja i granice zasad

- Własne reguły są w `assets/game-{id}.js`. `hundred-tools.js` współdzieli tylko prezentację, historię, tury i obsługę wejścia; model kompasu pozostaje osobnym plikiem.
- Szachy sprawdzają legalność króla, roszadę, bicie w przelocie, cztery awanse, mat, pat, pięćdziesiąt ruchów, powtórzenia i podstawowe przypadki niewystarczającego materiału. Klucz powtórzenia zachowuje pole bicia w przelocie również wtedy, gdy nie ma wykonującego je piona; nie jest to silnik turniejowy z kompletną arbitrażową oceną wszystkich martwych pozycji.
- Go używa punktacji obszarowej, komi 6,5 i prostego ko. Nie ma superko ani osobnego negocjowania martwych grup; sporne grupy należy dograć przed dwoma pasami.
- Tryktrak respektuje bandę, blokady, zbicia, dublety, maksymalne wykorzystanie kości, pierwszeństwo większej kości przy pojedynczym ruchu oraz wyprowadzanie. Pierwszy ruch ma gracz I zamiast porównywania kości otwarcia. Wynik dotyczy pojedynczej partii, bez kostki podwojeń.
- Gomoku jest swobodną odmianą z liniami co najmniej pięciu. Lis i gęsi używa wyłącznie linii prostopadłych i jednego skoku na turę. Ataxx i Lis i gęsi mają opisane limity ruchów bez postępu.
- Łamigłówki sprawdzają reguły, nie tożsamość ukrytego wzorca. Nie obiecują unikalności rozwiązań. Wyjazd jest mieszany odwracalnymi ruchami, figury Pięciu pól pochodzą z podziału ścieżki pokrywającej prostokąt, a Dokładnie 24 odrzuca nierozwiązywalne zestawy i używa dokładnych ułamków.
- Kręgle mają dziesięć rund i premie strike/spare, łącznie do 300 punktów. Rzutki mają rzeczywiste sektory, spalanie całej kolejki i zamknięcie podwójną. Artyleria i Minigolf używają autorskich torów i terenu, bez zasobów innych gier.
- Fizyka korzysta ze stałego kroku 1/120 sekundy. Gry działają lokalnie; komputer i symulowane obiekty nie są przedstawiane jako użytkownicy online.

## Układ ekranu

Zachowano odtwarzacz pełnej wysokości z poprzedniej zmiany. Tryktrak ma własne wektorowe punkty i pionki; na telefonie dzieli je na cztery czytelne rzędy, a w szerokim oknie dwa. Ma proporcje dopasowane do punktów planszy; kompas zajmuje całą dostępną przestrzeń. Panel pytań mieści treść i odpowiedzi razem, także dla najdłuższego z trzydziestu stwierdzeń. Dłuższe opisy wyników przewijają się wewnątrz panelu, przy stale dostępnych zakładkach i przyciskach. Wykres i pięć skal nie nakładają się na siebie.

Naprawiono też wyścig inicjalizacji wspólnego interfejsu: skrypt układający ekran jest dołączany po zakończeniu odroczonych skryptów gier. Przy wolnym ładowaniu silnika ustawienia trafiają do **Opcji**, a nie przypadkowo nad planszę. Osobny test celowo opóźnia ładowanie tryktraka.

## Weryfikacja

Polecenia testów:

```sh
python3 tests/test_hundred_games.py
python3 tests/test_compass.py
python3 tests/test_viewport.py
python3 tests/smoke.py
python3 tests/test_new_games.py
python3 tests/test_more_games.py
python3 tests/test_thirty_games.py
python3 tests/test_player_integration.py
python3 tests/test_others.py
```

Zestawy obejmują **152 scenariusze**: 35 dla nowych gier, 9 dla kompasu, 7 dla ekranów wszystkich 100 pozycji oraz 101 pozostałych regresji. Sprawdzane są cztery rozmiary okna (320 × 568, 390 × 844, 844 × 390, 1440 × 900), wszystkie strony osobno, oba motywy i pauza. Kompas dodatkowo sprawdza każde z 30 pytań w czterech rozmiarach, eksport, korekty odpowiedzi, minimalne pokrycie każdej osi oraz brak zapisu przy włączonych preferencjach.

Szachy mają niezależne liczby węzłów otwarcia 20, 400 i 8902; testy obejmują również pełnego mata. Tryktrak sprawdza zachowanie wszystkich 30 pionków przez całą partię. Gry planszowe, łamigłówki, quizy i gry z rundami mają testy zakończenia. Lot, łowienie i slalom są kończone kontrolerami wysyłającymi rzeczywiste klawisze; obrona trasy przechodzi pięć fal przy normalnej ekonomii. Nie modyfikowano kont produkcyjnych ani szyfrogramów archiwum. Opcjonalne testy odtworzonych prywatnych źródeł nie wchodzą do liczby powyżej.

Podglądy: [pytania kompasu](screenshots/hundred-games/compass-questions-mobile.png), [wynik kompasu](screenshots/hundred-games/compass-results-mobile.png), [partie](screenshots/hundred-games/compass-parties-mobile.png), [szachy](screenshots/hundred-games/chess-mobile.png), [tryktrak](screenshots/hundred-games/backgammon-mobile.png), [obrona w poziomie](screenshots/hundred-games/defense-landscape.png), [minigolf](screenshots/hundred-games/minigolf-desktop.png).
