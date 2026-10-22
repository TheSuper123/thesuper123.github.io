(() => {
  "use strict";
  const games = [
    {
      id: "snake",
      name: "Snake",
      file: "games/neonsnake1.html",
      art: "snake",
      category: "arcade",
      tag: "KLASYK",
      desc: "Jeszcze jeden kęs. Jeszcze jeden zakręt.",
      about:
        "Zbieraj jabłka i poluj na złoty owoc, który pojawia się po pięciu zwykłych. Wybierz wielkość planszy, jedno z trzech temp oraz ściany lub przechodzenie przez krawędzie. Gra zapamiętuje osobny rekord konfiguracji po zgodzie na zapis.",
      controls:
        "Strzałki / WASD, przyciski lub przesunięcie po planszy. P / Spacja: pauza. R: nowa runda.",
    },
    {
      id: "saper",
      name: "Saper",
      file: "games/saper.html",
      art: "saper",
      category: "logic",
      tag: "LOGIKA",
      desc: "Trochę liczenia. Odrobina odwagi.",
      about:
        "Odkrywaj pola bez min i korzystaj z liczb. Pierwsze pole oraz jego sąsiedztwo są bezpieczne. Jeśli liczba sąsiednich flag zgadza się z odkrytą liczbą, kliknij ją ponownie, aby odsłonić pozostałych sąsiadów. Porównuj czasy na czterech poziomach.",
      controls:
        "Kliknięcie / Enter: odkryj. Prawy przycisk, F lub przytrzymanie palca: flaga. Strzałki: wybór pola. Dostępny jest też przełącznik Odkryj / Flaga.",
    },
    {
      id: "tictactoe",
      name: "Kółko i krzyżyk",
      file: "games/tictactoe.html",
      art: "tictactoe",
      category: "logic",
      tag: "DLA DWÓCH / SOLO",
      desc: "Trzy w linii. Znasz zasady.",
      about:
        "Graj serię z drugą osobą albo z komputerem. W grze z komputerem wybierz X lub O i poziom przeciwnika. Wynik serii zostaje po rewanżu; podpowiedź pomaga znaleźć dobry ruch, a zakończona linia zostaje wyróżniona.",
      controls:
        "Kliknięcie lub Enter: postaw znak. Strzałki: wybierz pole. Nad planszą zmienisz rywala i własny znak.",
    },
    {
      id: "maze",
      name: "Labirynt",
      file: "games/neonmaze.html",
      art: "maze",
      category: "logic",
      tag: "NA ORIENTACJĘ",
      desc: "Każdy ślepy zaułek czegoś uczy.",
      about:
        "Każdy układ ma przejście. Zbierz trzy klucze i znajdź wyjście, korzystając ze śladu odwiedzonych pól. Wybierz rozmiar i nową albo dzienną trasę. Po ukończeniu porównaj liczbę kroków i czas; możesz powtórzyć ten sam układ.",
      controls:
        "Strzałki / WASD, przyciski lub przesunięcie po planszy. P: pauza. Zbieraj klucze, zanim wejdziesz na metę.",
    },
    {
      id: "geometry",
      name: "Geometry Run",
      file: "games/geometry-game.html",
      art: "geometry",
      category: "arcade",
      tag: "RYTM I REFLEKS",
      desc: "Jeden skok za późno to też za późno.",
      about:
        "Opanuj trzy etapy tej samej trasy: bieg, lot i finałowy bieg. Kolejna próba zachowuje układ przeszkód. Tryb treningowy pozwala wracać do punktów kontrolnych. Zbieraj znaczniki i wybierz tempo; nową trasę możesz wylosować osobno.",
      controls:
        "Spacja / strzałka w górę / W / dotknięcie: skok. W locie przytrzymuj. P: pauza. R: ponów próbę.",
    },
    {
      id: "arena",
      name: "Snake Arena",
      file: "games/snake.html",
      art: "arena",
      category: "arcade",
      tag: "ARENA Z BOTAMI",
      desc: "Więcej węży. Mniej miejsca na błędy.",
      about:
        "Zbieraj jedzenie na lokalnej arenie z botami i wykonuj trzy cele rundy. Kolejne kąski podtrzymują serię; przyspieszenie zużywa długość węża. Uważaj na granice i ciała rywali. Tabela pokazuje rzeczywisty stan tej rundy, bez fikcyjnych graczy online.",
      controls:
        "Mysz lub strzałki / WASD: kierunek. Przytrzymanie myszy albo przycisku przyspieszenia: sprint. Na telefonie joystick. P: pauza.",
    },
    {
      id: "saper-classic",
      name: "Saper / edycja klasyczna",
      file: "saper.html",
      art: "saper-classic",
      category: "logic",
      tag: "Z ARCHIWUM",
      desc: "Surowa plansza, konkretne wyzwanie.",
      about:
        "Ustaw własny rozmiar planszy i liczbę min. Pierwsze pole i jego sąsiedztwo są bezpieczne. Łącz odkrywanie sąsiadów z flagami i korzystaj z podpowiedzi, gdy utkniesz. Punktowana jest tylko klasyczna plansza 9 × 9 z 10 minami ukończona bez pomocy.",
      controls:
        "Kliknięcie / Enter: odkryj. Prawy przycisk, F lub długie dotknięcie: flaga. Strzałki: wybór pola. Podpowiedź i pauza mają osobne przyciski.",
    },
    {
      id: "little-flight",
      name: "Mały lot",
      file: "flappy.html",
      art: "bird-classic",
      category: "arcade",
      tag: "ZRĘCZNOŚCIOWA",
      desc: "Jeden podskok. Jeszcze kawałek nieba.",
      about:
        "Przeleć przez bramki i zbieraj złote pióra za dodatkowe punkty. Wybierz jedno z trzech temp i utrzymuj własny rytm. Trasa płynnie zmienia wysokość, a rekord jest osobny dla każdego tempa. Grafika i dźwięki nie wymagają zasobów cudzych gier.",
      controls:
        "Spacja, dotknięcie planszy lub przycisk Podskocz: lot. P / Escape: pauza. R: nowa runda.",
    },
    {
      id: "2048",
      name: "2048",
      file: "games/2048.html",
      art: "2048",
      category: "logic",
      tag: "LICZBY W RUCHU",
      desc: "Dwa razy bliżej. Jeszcze jedno połączenie.",
      about:
        "Przesuwaj całą planszę i łącz jednakowe liczby. Każdy kafelek łączy się najwyżej raz w ruchu. Cel to 2048, ale potem możesz grać dalej. Cofnięcie pomaga przemyśleć ostatnią decyzję.",
      controls:
        "Strzałki / WASD, przyciski lub gest po planszy. U: cofnij. P: pauza.",
    },
    {
      id: "memory",
      name: "Memory",
      file: "games/memory.html",
      art: "memory",
      category: "logic",
      tag: "PAMIĘĆ",
      desc: "Widziałeś już ten znak. Tylko gdzie?",
      about:
        "Odkryj wszystkie pary autorskich znaków. Wybierz talię z 6, 8 lub 12 parami. Zegar rusza przy pierwszej karcie, a rekord uwzględnia liczbę prób i czas. Pauza zasłania planszę.",
      controls:
        "Kliknięcie / dotknięcie / Enter: odkryj kartę. Strzałki: wybierz. P: pauza.",
    },
    {
      id: "breakout",
      name: "Paletka",
      file: "games/breakout.html",
      art: "breakout",
      category: "arcade",
      tag: "ODBIJ I ROZBIJ",
      desc: "Dobry kąt robi różnicę.",
      about:
        "Odbijaj piłkę i rozbij trzy ściany cegieł. Masz trzy piłki na całą rundę. Miejsce odbicia od paletki zmienia kierunek lotu; mocniejsze cegły potrzebują dwóch trafień. Wybierz jedno z trzech temp.",
      controls:
        "Mysz / palec na planszy albo strzałki / A, D: paletka. Spacja: podaj piłkę. P: pauza.",
    },
    {
      id: "sudoku",
      name: "Sudoku",
      file: "games/sudoku.html",
      art: "sudoku",
      category: "logic",
      tag: "9 × 9",
      desc: "Każda cyfra ma swoje miejsce.",
      about:
        "Uzupełnij cyfry od 1 do 9 w wierszach, kolumnach i kwadratach 3 × 3. Każda generowana plansza ma jedno rozwiązanie. Korzystaj z notatek, cofania i sprawdzania wpisów. Rekordy czasu dotyczą rund bez podpowiedzi.",
      controls:
        "Wybierz pole i wpisz 1–9 lub użyj przycisków. N: notatki. Backspace: wymaż. U / Ctrl+Z: cofnij. P: pauza.",
    },
    {
      id: "sokoban",
      name: "Skrzynki",
      file: "games/sokoban.html",
      art: "sokoban",
      category: "logic",
      tag: "PLANOWANIE",
      desc: "Najpierw pomyśl. Potem popchnij.",
      about:
        "Przesuń wszystkie skrzynie na zaznaczone cele w ośmiu własnych magazynach. Skrzynie można tylko pchać. Każdy początkowy układ da się rozwiązać; po złym ruchu skorzystaj z cofania lub zacznij poziom od nowa.",
      controls:
        "Strzałki / WASD, przyciski albo gest po planszy. U: cofnij. R: restart poziomu. P: pauza.",
    },
    {
      id: "connect-four",
      name: "Cztery w rzędzie",
      file: "games/connect-four.html",
      art: "connect-four",
      category: "logic",
      tag: "RUCH PO RUCHU",
      desc: "Zajmij cztery pola w jednej linii, zanim zrobi to rywal.",
      about:
        "Wrzucaj krążki do siedmiu kolumn. Wygraj poziomo, pionowo albo po skosie. Graj z komputerem na dwóch poziomach lub z drugą osobą. Cofnięcie wycofuje także odpowiedź komputera.",
      controls:
        "Kliknij kolumnę. Strzałki wybierają pole, Enter zatwierdza. U: cofnij.",
    },
    {
      id: "reversi",
      name: "Reversi",
      file: "games/reversi.html",
      art: "reversi",
      category: "logic",
      tag: "ODWRÓĆ SYTUACJĘ",
      desc: "Przejmuj krążki, dbaj o narożniki, policz przewagę.",
      about:
        "Obejmij krążki rywala swoimi z obu stron. Podświetlone punkty wskazują dozwolone ruchy. Brak ruchu oznacza przekazanie kolejki; partia kończy się dopiero, gdy żaden gracz nie może zagrać. Komputer lub lokalna gra we dwoje.",
      controls:
        "Kliknij dozwolone pole. Strzałki: wybór, Enter: ruch. U: cofnij.",
    },
    {
      id: "dots-boxes",
      name: "Kropki i kreski",
      file: "games/dots-boxes.html",
      art: "dots-boxes",
      category: "logic",
      tag: "DOMKNIJ KWADRAT",
      desc: "Zamykaj pola. Zyskaj punkt i jeszcze jeden ruch.",
      about:
        "Łącz sąsiednie kropki na planszy 4 × 4. Osoba zamykająca kwadrat dostaje punkt oraz dodatkową kolejkę. Wygra właściciel największej liczby pól. Możesz zagrać z komputerem lub z drugą osobą.",
      controls:
        "Kliknij wolną kreskę między kropkami. Klawiatura: strzałki i Enter. U: cofnij.",
    },
    {
      id: "mancala",
      name: "Kalaha",
      file: "games/mancala.html",
      art: "mancala",
      category: "logic",
      tag: "SIEJ I ZBIERAJ",
      desc: "Dwanaście dołków, dwa magazyny i jeden sprytny obieg.",
      about:
        "Wybierz własny dołek i rozsiej wszystkie kamienie po jednym, pomijając magazyn przeciwnika. Ostatni kamień we własnym magazynie daje dodatkową turę. Ostatni we własnym pustym dołku przejmuje kamienie naprzeciwko. Koniec jednej strony zbiera pozostałe kamienie do magazynów.",
      controls:
        "Dolny rząd należy do gracza I. Kliknij dołek. U: cofnij. Komputer lub dwie osoby.",
    },
    {
      id: "fifteen",
      name: "Piętnastka",
      file: "games/fifteen.html",
      art: "fifteen",
      category: "logic",
      tag: "JEDNO WOLNE POLE",
      desc: "Przesuwaj liczby. Zostaw miejsce na ostatni ruch.",
      about:
        "Ułóż kafelki rosnąco, pozostawiając puste pole w prawym dolnym rogu. Każde losowanie powstaje z legalnych ruchów, więc można je rozwiązać. Wybierz planszę 3 × 3 lub 4 × 4; skorzystaj z cofania i wskazówki.",
      controls:
        "Dotknij kafelka przy pustym polu. Strzałki / WASD: kierunek przesunięcia pustego pola. U: cofnij.",
    },
    {
      id: "lights-out",
      name: "Zgaś światła",
      file: "games/lights-out.html",
      art: "lights-out",
      category: "logic",
      tag: "EFEKT SĄSIADA",
      desc: "Jedno kliknięcie zmienia pięć pól. Znajdź porządek.",
      about:
        "Naciśnięcie pola odwraca jego stan i stan czterech sąsiadów. Zgaś całą planszę 4 × 4 albo 5 × 5. Układy powstają z rozwiązanej planszy. Podpowiedź wylicza poprawny ruch z aktualnego stanu.",
      controls:
        "Kliknij pole. Strzałki: wybór, Enter: przełącz. U: cofnij. Podpowiedź wyróżnia pole.",
    },
    {
      id: "nonogram",
      name: "Nonogram",
      file: "games/nonogram.html",
      art: "nonogram",
      category: "logic",
      tag: "OBRAZ Z LICZB",
      desc: "Wypełnij kratki i odsłoń mały obrazek.",
      about:
        "Liczby opisują kolejne grupy zamalowanych pól w każdym wierszu i kolumnie. Pomiędzy grupami zostaw przynajmniej jedną pustą kratkę. Osiem własnych obrazków, cofanie, oznaczanie pustych pól i sprawdzenie zgodności z liczbami.",
      controls:
        "Kliknij, aby wypełnić. Prawy przycisk lub tryb ×: oznacz puste. Strzałki i Enter. U: cofnij.",
    },
    {
      id: "hanoi",
      name: "Wieże Hanoi",
      file: "games/hanoi.html",
      art: "hanoi",
      category: "logic",
      tag: "PRZENIEŚ STOS",
      desc: "Trzy wieże. Każdy krążek ma swoje miejsce.",
      about:
        "Przenieś cały stos na prawą wieżę. Wolno przenosić tylko jeden wierzchni krążek, a większy nigdy nie może leżeć na mniejszym. Wybierz od 3 do 7 krążków, cofnij ruch lub poproś o wskazówkę z aktualnej pozycji.",
      controls:
        "Wybierz wieżę źródłową i docelową. Klawisze 1–3 działają tak samo. U: cofnij.",
    },
    {
      id: "peg-solitaire",
      name: "Samotnik",
      file: "games/peg-solitaire.html",
      art: "peg-solitaire",
      category: "logic",
      tag: "ZOSTAŃ JEDEN",
      desc: "Przeskocz pionek. Zostaw na planszy tylko jeden.",
      about:
        "Przeskocz pionek w linii prostej do pustego pola i zdejmij przeskoczony. Celem jest pozostawienie jednego pionka. Trzy rozmiary wyzwania powstają przez odwracanie legalnych skoków, dlatego każdy start da się ukończyć. Cofanie i restart tego samego układu.",
      controls:
        "Wybierz pionek, potem pole za jego sąsiadem. Strzałki i Enter. U: cofnij.",
    },
    {
      id: "codebreaker",
      name: "Łamacz kodu",
      file: "games/codebreaker.html",
      art: "codebreaker",
      category: "logic",
      tag: "CZTERY ZNAKI",
      desc: "Dziesięć prób, sześć znaków i ukryty układ.",
      about:
        "Odgadnij cztery cyfry od 1 do 6. Cyfry mogą się powtarzać. Wynik trafień podaje osobno poprawne miejsca i poprawne cyfry w innych miejscach, bez podwójnego liczenia. Masz dziesięć prób.",
      controls:
        "Wybierz miejsce i cyfrę albo wpisz 1–6. Strzałki zmieniają miejsce. Enter: sprawdź. Backspace: usuń.",
    },
    {
      id: "word-search",
      name: "Wykreślanka",
      file: "games/word-search.html",
      art: "word-search",
      category: "logic",
      tag: "MIĘDZY LITERAMI",
      desc: "Wypatrz osiem słów ukrytych w gąszczu liter.",
      about:
        "Osiem słów z wybranej kategorii ukrywa się w ośmiu kierunkach, także od tyłu. Zaznacz pierwszy i ostatni znak. Każda nowa plansza losuje pozycje; możesz poprosić o wskazanie początku słowa.",
      controls:
        "Dotknij początku i końca słowa. Strzałki i Enter wybierają pola. Escape: pauza i anulowanie zaznaczenia.",
    },
    {
      id: "word-guess",
      name: "Litera po literze",
      file: "games/word-guess.html",
      art: "word-guess",
      category: "logic",
      tag: "SŁOWO NA DZIŚ?",
      desc: "Odgadnij słowo, zanim zapełni się siedem pól.",
      about:
        "Wybieraj litery polskiego alfabetu i odsłoń słowo z kategorii natura, dom lub podróże. Siedem nietrafionych liter kończy rundę. Trafione i odrzucone litery pozostają widoczne; powtórzenie litery nie odbiera próby.",
      controls:
        "Dotknij litery lub wpisz ją na klawiaturze. Polskie znaki działają także z klawiatury ekranowej.",
    },
    {
      id: "echo",
      name: "Echo",
      file: "games/echo.html",
      art: "echo",
      category: "arcade",
      tag: "POWTÓRZ RYTM",
      desc: "Cztery pola. Coraz dłuższy ślad do powtórzenia.",
      about:
        "Obserwuj kolejność rozświetlanych pól i odtwórz ją. Każda poprawna seria dopisuje jeden znak. Wybierz spokojny lub szybki pokaz. Pauza zatrzymuje pokaz w tym samym miejscu, bez utraty rundy.",
      controls:
        "Klikaj pola lub używaj klawiszy 1–4. Zacznij przyciskiem Pokaż sekwencję. P: pauza.",
    },
    {
      id: "moles",
      name: "Kretowisko",
      file: "games/moles.html",
      art: "moles",
      category: "arcade",
      tag: "TRAF W MOMENT",
      desc: "Trafiaj krety. Omijaj kamienie. Utrzymuj serię.",
      about:
        "Masz 30 sekund na trafianie pojawiających się kretów. Kolejne trafienia podnoszą mnożnik, a spóźnienie przerywa serię. Kliknięcie kamienia lub pustego dołka odejmuje punkty. Dwa tempa, rzeczywisty czas rundy i natychmiastowa reakcja na dotyk.",
      controls:
        "Dotknij kreta lub użyj klawiszy 1–9 odpowiadających dołkom. P: pauza.",
    },
    {
      id: "pong",
      name: "Pojedynek",
      file: "games/pong.html",
      art: "pong",
      category: "arcade",
      tag: "DRUGA STRONA STOŁU",
      desc: "Ty, komputer i piłka, która wraca coraz szybciej.",
      about:
        "Zdobądź siedem punktów przeciw komputerowi. Kąt odbicia zależy od miejsca trafienia w paletkę, a każde odbicie zwiększa tempo. Trzy poziomy rywala, sterowanie palcem i pauza bez utraty serwisu.",
      controls:
        "Mysz / palec na planszy albo W, S / strzałki góra, dół: paletka. Spacja: serwis. P: pauza.",
    },
    {
      id: "orbit",
      name: "Orbita",
      file: "games/orbit.html",
      art: "orbit",
      category: "arcade",
      tag: "MAŁY STATEK, DUŻO MIEJSCA",
      desc: "Obracaj się, przyspieszaj i rozbij trzy fale skał.",
      about:
        "Steruj statkiem z bezwładnością na zawijającej się planszy. Duże skały rozpadają się na mniejsze. Masz trzy osłony i krótki czas ochrony po zderzeniu. Ukończ trzy fale; kod i wektorowe kształty powstały dla tej strony.",
      controls:
        "A, D / lewo, prawo: obrót. W / góra: ciąg. Spacja: strzał. Na telefonie cztery przyciski. P: pauza.",
    },
    {
      id: "stack",
      name: "Wieża",
      file: "games/stack.html",
      art: "stack",
      category: "arcade",
      tag: "ZŁAP TEN PION",
      desc: "Zatrzymaj klocek dokładnie nad poprzednim.",
      about:
        "Buduj wieżę z przesuwających się klocków. Wystający fragment odpada, a następne piętro ma szerokość pozostałego. Dokładne trafienie zachowuje szerokość. Tempo rośnie wraz z wysokością. Spróbuj dotrzeć do 25 pięter.",
      controls:
        "Dotknij planszy, kliknij przycisk Postaw albo naciśnij Spację / Enter. P: pauza.",
    },
    {
      id: "checkers",
      name: "Warcaby",
      file: "games/checkers.html",
      art: "checkers",
      category: "logic",
      tag: "BIJ I AWANSUJ",
      desc: "Zbijaj pionki. Pilnuj przekątnych.",
      about:
        "Warcaby angielskie na planszy 8 × 8: bicie jest obowiązkowe, także wielokrotne. Zwykłe pionki idą i biją do przodu; damki poruszają się o jedno pole w obu kierunkach. Awans kończy turę. Komputer lub dwie osoby.",
      controls: "Wybierz pionek i pole docelowe. U: cofnij.",
    },
    {
      id: "hex",
      name: "Mosty Hex",
      file: "games/hex.html",
      art: "hex",
      category: "logic",
      tag: "POŁĄCZ BRZEGI",
      desc: "Znajdź własną drogę przez sześciokąty.",
      about:
        "Gracz I łączy lewy i prawy brzeg, gracz II górny i dolny. Łańcuch składa się z sąsiednich pól. Plansza 7 × 7, komputer lub lokalna gra we dwoje, cofanie.",
      controls: "Kliknij wolne pole. Strzałki i Enter wybierają pola.",
    },
    {
      id: "morris",
      name: "Młynek",
      file: "games/morris.html",
      art: "morris",
      category: "logic",
      tag: "TRZY, POTEM RUCH",
      desc: "Zamknij młynek i odbierz pionek.",
      about:
        "Najpierw ustaw po dziewięć pionków na 24 polach. Potem przesuwaj je po liniach; trzy pozostałe pionki mogą skakać. Trzy w jednej linii pozwalają zdjąć pionek rywala spoza młynka, chyba że wszystkie są w młynkach. Komputer lub dwie osoby.",
      controls:
        "Wybierz miejsce, potem pionek i cel. Po młynku wybierz pionek rywala.",
    },
    {
      id: "battleships",
      name: "Okręty",
      file: "games/battleships.html",
      art: "battleships",
      category: "logic",
      tag: "SZUKAJ NA WODZIE",
      desc: "Jeden strzał, jeden nowy trop.",
      about:
        "Odszukaj flotę komputera na planszy 8 × 8. Każda strona ma okręty długości 4, 3, 3 i 2 bez stykania. Twój przeciwnik szuka sąsiadów trafienia. Floty są losowane przed rundą.",
      controls:
        "Kliknij pole na radarze. Na drugiej planszy zobaczysz własną flotę.",
    },
    {
      id: "domino",
      name: "Domino",
      file: "games/domino.html",
      art: "domino",
      category: "logic",
      tag: "DOPASUJ KONIEC",
      desc: "Dwie połówki. Kilka dobrych ruchów.",
      about:
        "Graj zestawem podwójna szóstka przeciw komputerowi. Dopasowuj kostkę do końca łańcucha. Gdy nie masz ruchu, dobierz kostkę; po wyczerpaniu stosu pasuj. Wygrywa pusta ręka lub niższa suma oczek przy blokadzie.",
      controls:
        "Wybierz stronę łańcucha i kostkę z ręki. Dobierz lub pasuj osobnym przyciskiem.",
    },
    {
      id: "solitaire",
      name: "Pasjans",
      file: "games/solitaire.html",
      art: "solitaire",
      category: "logic",
      tag: "PORZĄDEK W KARTACH",
      desc: "Od asa do króla, kolor po kolorze.",
      about:
        "Klasyczny pasjans Klondike: siedem kolumn, dobieranie po jednej karcie, cztery fundamenty od asa. Kolumny maleją z naprzemiennymi kolorami, na puste miejsce wchodzi król. Możesz przenosić odkryte sekwencje i cofać ruchy.",
      controls:
        "Wybierz kartę, potem kolumnę lub fundament. Dotknij talii, aby dobrać.",
    },
    {
      id: "freecell",
      name: "Wolne komórki",
      file: "games/freecell.html",
      art: "freecell",
      category: "logic",
      tag: "CZTERY MIEJSCA ZAPASU",
      desc: "Wszystkie karty widoczne. Cały plan przed Tobą.",
      about:
        "Ułóż karty na czterech fundamentach od asa. W ośmiu kolumnach buduj malejąco, naprzemiennymi kolorami. Cztery wolne komórki mieszczą po jednej karcie. Wielkość przenoszonej sekwencji zależy od wolnych komórek i kolumn.",
      controls:
        "Wybierz kartę lub sekwencję, a potem kolumnę, komórkę lub fundament. U: cofnij.",
    },
    {
      id: "golf",
      name: "Golf karciany",
      file: "games/golf.html",
      art: "golf",
      category: "logic",
      tag: "O JEDNO OCZKO",
      desc: "Zdejmij wszystkie karty ze stołu.",
      about:
        "Usuwaj wierzchnie karty z siedmiu kolumn, jeśli ich wartość różni się o jeden od karty bazowej. As i król nie są sąsiadami. Gdy utkniesz, dobierz ze stosu. Oczyść 35 kart, zanim skończy się talia.",
      controls: "Kliknij dostępną kartę albo Dobierz. U: cofnij.",
    },
    {
      id: "dice",
      name: "Kości",
      file: "games/dice.html",
      art: "dice",
      category: "logic",
      tag: "PIĘĆ KOŚCI",
      desc: "Zostawić parę czy rzucać jeszcze raz?",
      about:
        "Pięć kości, do trzech rzutów w turze i trzynaście kategorii. Zatrzymuj wybrane kości. Wybór wyniku zamyka kategorię; górna sekcja daje 35 premii po zebraniu 63 punktów. Wszystkie wyniki są liczone z rzeczywistego układu.",
      controls:
        "Rzuć, zatrzymaj kości kliknięciem i wybierz kategorię z tabeli.",
    },
    {
      id: "nim",
      name: "Nim",
      file: "games/nim.html",
      art: "nim",
      category: "logic",
      tag: "JEDEN STOS NA TURĘ",
      desc: "Zostaw rywalowi trudny wybór.",
      about:
        "W turze zabierz dowolną dodatnią liczbę kamieni z jednego stosu. Wygrywa osoba zabierająca ostatni. Trzy stosy i komputer korzystający z sumy nimowej lub gra we dwoje.",
      controls: "Wybierz stos i liczbę kamieni do zabrania. U: cofnij.",
    },
    {
      id: "chomp",
      name: "Ostatni kęs",
      file: "games/chomp.html",
      art: "chomp",
      category: "logic",
      tag: "OMIŃ NAROŻNIK",
      desc: "Ten pierwszy kawałek zostaw rywalowi.",
      about:
        "Wybierając pole, zjadasz także wszystkie pola na prawo i poniżej. Lewy górny kawałek jest zatruty: kto go weźmie, przegrywa. Komputer lub dwie osoby, cofanie i podgląd wybranego cięcia.",
      controls: "Kliknij kawałek. U: cofnij.",
    },
    {
      id: "amazons",
      name: "Amazonki",
      file: "games/amazons.html",
      art: "amazons",
      category: "logic",
      tag: "ZOSTAW SOBIE PRZEJŚCIE",
      desc: "Ruch, strzała, kawałek przestrzeni mniej.",
      about:
        "Dwie amazonki na stronę na planszy 6 × 6. Przesuń amazonkę jak królową szachową, potem wystrzel z jej nowego pola strzałę w linii prostej. Strzała zamyka pole na stałe. Przegrywa gracz bez ruchu. Komputer lub dwie osoby.",
      controls: "Wybierz amazonkę, cel ruchu i cel strzały. U: cofnij.",
    },
    {
      id: "takuzu",
      name: "Równowaga",
      file: "games/takuzu.html",
      art: "takuzu",
      category: "logic",
      tag: "POŁOWA ZER, POŁOWA JEDYNEK",
      desc: "Żaden znak nie lubi trzeciego sąsiada.",
      about:
        "Uzupełnij planszę 6 × 6. Każdy wiersz i kolumna ma po trzy zera i jedynki. Trzy takie same znaki obok siebie są zabronione, a dwa wiersze lub kolumny nie mogą być identyczne. Stałe pola pozostają zablokowane.",
      controls:
        "Kliknięcie zmienia puste → 0 → 1. Klawisze 0 i 1 wpisują znak. U: cofnij.",
    },
    {
      id: "futoshiki",
      name: "Mniejsze większe",
      file: "games/futoshiki.html",
      art: "futoshiki",
      category: "logic",
      tag: "CYFRY I NIERÓWNOŚCI",
      desc: "Małe znaki robią dużą różnicę.",
      about:
        "Wpisz 1–5 po razie w każdym wierszu i kolumnie. Pomiędzy polami znajdują się znaki mniejsze i większe. Spełnij wszystkie nierówności. Dostępne są cofanie i sprawdzenie konfliktów.",
      controls: "Wybierz pole, potem cyfrę. Backspace: usuń. U: cofnij.",
    },
    {
      id: "skyscrapers",
      name: "Wieżowce",
      file: "games/skyscrapers.html",
      art: "skyscrapers",
      category: "logic",
      tag: "WIDOK OD ULICY",
      desc: "Ile dachów widać z tej strony?",
      about:
        "Wpisz wysokości 1–5 po razie w każdym wierszu i kolumnie. Liczby na brzegach mówią, ile budynków widać z danej strony — wyższy zasłania niższe stojące za nim.",
      controls:
        "Wybierz pole i wpisz cyfrę. Przyciski 1–5 działają na telefonie. U: cofnij.",
    },
    {
      id: "cages",
      name: "Klatki liczbowe",
      file: "games/cages.html",
      art: "cages",
      category: "logic",
      tag: "LICZBY WE WSPÓŁPRACY",
      desc: "Każda grupa ma swój wynik.",
      about:
        "Wpisz 1–4 po razie w wierszach i kolumnach. Każda zaznaczona klatka ma działanie i wynik. Spełnij jednocześnie warunki klatek oraz planszy. Układy i podziały są generowane lokalnie.",
      controls: "Wybierz pole, potem cyfrę. Backspace: wymaż. U: cofnij.",
    },
    {
      id: "shikaku",
      name: "Prostokąty",
      file: "games/shikaku.html",
      art: "shikaku",
      category: "logic",
      tag: "PODZIEL CAŁĄ PLANSZĘ",
      desc: "Jedna liczba, jeden prostokąt.",
      about:
        "Podziel planszę 6 × 6 na prostokąty. Każdy zawiera dokładnie jedną liczbę, która oznacza jego pole. Prostokąty nie mogą się nakładać. Zaznacz przeciwległe narożniki; cofanie pomaga poprawić podział.",
      controls:
        "Kliknij dwa narożniki prostokąta. U: cofnij. Kliknięcie gotowego obszaru pozwala go usunąć.",
    },
    {
      id: "bridges",
      name: "Wyspy i mosty",
      file: "games/bridges.html",
      art: "bridges",
      category: "logic",
      tag: "POŁĄCZ ARCHIPELAG",
      desc: "Każda wyspa chce tylu mostów, ile mówi.",
      about:
        "Łącz sąsiednie wyspy jednym albo dwoma mostami. Liczba na wyspie określa sumę dochodzących mostów. Wszystkie wyspy muszą tworzyć jedną sieć. Mosty prowadzą tylko po liniach między sąsiadami i nie krzyżują się.",
      controls:
        "Wybierz dwie sąsiednie wyspy; kolejne kliknięcia zmieniają 0, 1 i 2 mosty. U: cofnij.",
    },
    {
      id: "untangle",
      name: "Rozplącz",
      file: "games/untangle.html",
      art: "untangle",
      category: "logic",
      tag: "LINIE BEZ KOLIZJI",
      desc: "Wszystko da się rozsunąć.",
      about:
        "Przesuwaj dziewięć wierzchołków, aż żadne dwie krawędzie nie będą się przecinać. Przecięcie we wspólnym końcu jest dozwolone. Każdy graf ma przygotowane płaskie ułożenie.",
      controls:
        "Przeciągaj punkty. Klawiatura: 1–9 wybiera punkt, strzałki go przesuwają. U: cofnij.",
    },
    {
      id: "loop",
      name: "Zamknij pętlę",
      file: "games/loop.html",
      art: "loop",
      category: "logic",
      tag: "JEDNA LINIA DOOKOŁA",
      desc: "Liczby podpowiedzą, którędy wrócić.",
      about:
        "Zaznacz jedną zamkniętą pętlę po krawędziach pól. Liczba w polu mówi, ile jego boków należy do pętli. Rozgałęzienia i oddzielne pętle są zabronione. Układy powstają z zamkniętej granicy własnych figur.",
      controls: "Klikaj krawędzie, aby je włączać. U: cofnij.",
    },
    {
      id: "invaders",
      name: "Najeźdźcy",
      file: "games/invaders.html",
      art: "invaders",
      category: "arcade",
      tag: "TRZY FALE",
      desc: "Zrób miejsce na niebie.",
      about:
        "Przesuwaj statek, trafiaj formację i unikaj pocisków. Trzy fale, trzy osłony, coraz szybsza formacja i krótka ochrona po trafieniu. Własne geometryczne statki i lokalny silnik.",
      controls:
        "A, D / strzałki: ruch. Spacja: strzał. Na telefonie trzy przyciski.",
    },
    {
      id: "crossing",
      name: "Przeprawa",
      file: "games/crossing.html",
      art: "crossing",
      category: "arcade",
      tag: "DRUGI BRZEG",
      desc: "Poczekaj na lukę. Potem ruszaj.",
      about:
        "Przejdź między pojazdami i przepłyń rzekę na belkach. Zajmij trzy różne miejsca na drugim brzegu. Masz trzy próby, a każda przeprawa ma własny limit czasu.",
      controls: "Strzałki / WASD lub cztery przyciski: jeden krok. P: pauza.",
    },
    {
      id: "racer",
      name: "Zakręt",
      file: "games/racer.html",
      art: "racer",
      category: "arcade",
      tag: "TRZY PASY",
      desc: "Znajdź wolny pas przed następnym autem.",
      about:
        "Dotrzyj do mety, omijając ruch drogowy i zbierając paliwo. Zmieniaj pasy bez opóźnienia. Zderzenie zużywa osłonę, a pusty bak kończy przejazd. Trzy osłony i trasa 3000 metrów.",
      controls: "A, D / lewo, prawo lub przyciski: zmiana pasa. Spacja: start.",
    },
    {
      id: "platformer",
      name: "Platformy",
      file: "games/platformer.html",
      art: "platformer",
      category: "arcade",
      tag: "SKOK PO KLUCZ",
      desc: "Nie każdy skok trzeba robić z rozpędu.",
      about:
        "Przejdź trzy własne etapy, zbierz klucze i wejdź do drzwi. Fizyka uwzględnia krótki bufor skoku i tolerancję zejścia z krawędzi. Przeszkody są stałe, a strata próby odtwarza ten sam etap.",
      controls:
        "A, D / lewo, prawo: bieg. W / góra / Spacja: skok. Trzy przyciski na telefonie.",
    },
    {
      id: "lander",
      name: "Lądownik",
      file: "games/lander.html",
      art: "lander",
      category: "arcade",
      tag: "SPOKOJNIE DO ZIEMI",
      desc: "Mniej ciągu. Więcej wyczucia.",
      about:
        "Wyląduj na trzech lądowiskach. Steruj obrotem i silnikiem, pilnując paliwa. Bezpieczne lądowanie wymaga małego przechyłu oraz małej prędkości; wskaźniki pokazują aktualny stan.",
      controls:
        "A, D / lewo, prawo: obrót. W / góra: silnik. Na telefonie trzy przyciski.",
    },
    {
      id: "pinball",
      name: "Flipper",
      file: "games/pinball.html",
      art: "pinball",
      category: "arcade",
      tag: "JESZCZE JEDNO ODBICIE",
      desc: "Utrzymaj piłkę między łapkami.",
      about:
        "Odbijaj piłkę dwiema łapkami, trafiaj zderzaki i cele u góry stołu. Masz trzy piłki. Łapki przekazują impuls zależny od ruchu, a fizyka działa stałym krokiem czasu.",
      controls:
        "A / lewo i D / prawo: łapki. Spacja: podaj piłkę. Przyciski działają przy przytrzymaniu.",
    },
    {
      id: "archery",
      name: "Łucznik",
      file: "games/archery.html",
      art: "archery",
      category: "arcade",
      tag: "DZIESIĘĆ STRZAŁ",
      desc: "Weź poprawkę na wiatr.",
      about:
        "Oddaj dziesięć strzałów do poruszającej się tarczy. Ustaw kąt i siłę, uwzględnij grawitację oraz wiatr. Punkty zależą od odległości od środka tarczy w chwili trafienia.",
      controls:
        "Przeciągnij po planszy lub ustaw suwaki kąta i siły. Spacja / Strzel: wypuść strzałę.",
    },
    {
      id: "billiards",
      name: "Bilard",
      file: "games/billiards.html",
      art: "billiards",
      category: "arcade",
      tag: "SZEŚĆ BIL DO ŁUZ",
      desc: "Zobacz kąt, zanim uderzysz.",
      about:
        "Wbij sześć kolorowych bil w dziesięciu uderzeniach. Biała bila przekazuje pęd przy zderzeniu, bandy odbijają, a tarcie zatrzymuje ruch. Wpadnięcie białej kosztuje dodatkową próbę.",
      controls:
        "Przeciągnij od białej, by wybrać kierunek i siłę. Strzałki zmieniają kąt, Spacja uderza.",
    },
    {
      id: "rhythm",
      name: "Cztery takty",
      file: "games/rhythm.html",
      art: "rhythm",
      category: "arcade",
      tag: "RYTM W OCZACH",
      desc: "Traf dokładnie w linię.",
      about:
        "Cztery tory i autorska sekwencja rytmiczna. Uderzaj, kiedy znaczniki przechodzą przez linię. Trafienie ma okno 140 ms; dokładność buduje serię. Dwa tempa i 30-sekundowa runda. Gra działa bez dźwięku.",
      controls:
        "D, F, J, K lub cztery przyciski odpowiadają torom. Spacja: start.",
    },
    {
      id: "balance",
      name: "Balans",
      file: "games/balance.html",
      art: "balance",
      category: "arcade",
      tag: "OSIEM PUNKTÓW",
      desc: "Delikatny przechył wystarczy.",
      about:
        "Przechylaj belkę i prowadź kulkę do ośmiu kolejnych znaczników. Uważaj na bezwładność i końce belki. Masz minutę; nadmierne wychylenie pozwala kulce wypaść.",
      controls:
        "A, D / lewo, prawo lub przytrzymanie przycisków: przechył belki. Spacja: start.",
    },
  ];
  window.SpinnerGames = games;
  const grid = document.querySelector("#game-grid");
  if (!grid) return;
  const prefs = window.SpinnerStorage.preferences;
  const history = prefs.get("recent", []);
  if (Array.isArray(history)) {
    const recentGames = history
      .map((id) => games.find((game) => game.id === id))
      .filter(Boolean)
      .slice(0, 3);
    if (recentGames.length) {
      const strip = document.createElement("div");
      strip.className = "recent-strip";
      const label = document.createElement("span");
      label.textContent = "WRÓCIMY DO RUNDY?";
      strip.append(label);
      for (const game of recentGames) {
        const link = document.createElement("a");
        link.href = "gra.html?gra=" + game.id;
        link.textContent = game.name + " ↗";
        strip.append(link);
      }
      document.querySelector(".catalog-toolbar").after(strip);
      window.addEventListener("spinner:preferences-cleared", () =>
        strip.remove(),
      );
    }
  }
  let favorites = new Set(
    (Array.isArray(prefs.get("favorites", []))
      ? prefs.get("favorites", [])
      : []
    ).filter((id) => games.some((game) => game.id === id)),
  );
  let filter = "all";
  const search = document.querySelector("#game-search");
  const fold = (text) =>
    text
      .toLocaleLowerCase("pl")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l");
  function render() {
    const query = fold(search.value.trim());
    const list = games.filter(
      (game) =>
        (filter === "all" ||
          (filter === "favorites"
            ? favorites.has(game.id)
            : game.category === filter)) &&
        fold(game.name + " " + game.desc + " " + game.id).includes(query),
    );
    grid.replaceChildren();
    for (const game of list) {
      const article = document.createElement("article");
      article.className = "game-card";
      const url = "gra.html?gra=" + encodeURIComponent(game.id);
      const selected = favorites.has(game.id);
      article.innerHTML = `<a class="card-image" href="${url}" tabindex="-1" aria-hidden="true"><img src="assets/art/${game.art}.svg" alt="" width="600" height="430" loading="lazy"><span class="card-number">SG / ${String(games.indexOf(game) + 1).padStart(2, "0")}</span><span class="card-open">↗</span></a><div class="card-info"><h3><a href="${url}">${game.name}</a></h3><button class="favorite" aria-label="${selected ? "Usuń z ulubionych" : "Dodaj do ulubionych"}: ${game.name}" aria-pressed="${selected}">${selected ? "♥" : "♡"}</button></div><p class="card-desc">${game.desc}</p><div class="card-meta">${game.tag}</div>`;
      article.querySelector(".favorite").addEventListener("click", () => {
        if (favorites.has(game.id)) favorites.delete(game.id);
        else favorites.add(game.id);
        prefs.set("favorites", [...favorites]);
        render();
        const button = [...grid.querySelectorAll(".favorite")].find((btn) =>
          btn.getAttribute("aria-label").endsWith(": " + game.name),
        );
        button?.focus({ preventScroll: true });
        if (!window.SpinnerStorage.consent?.preferences)
          window.spinnerToast(
            "Ulubione są dostępne na tej stronie. Włącz zapis w ustawieniach cookies, aby zachować je na później.",
          );
      });
      grid.append(article);
    }
    document.querySelector("#empty-state").hidden = list.length > 0;
    document.querySelector("#result-count").textContent =
      `${String(list.length).padStart(2, "0")} / ${games.length} GIER`;
    document.querySelector("#total-count").textContent = games.length;
  }
  search.addEventListener("input", render);
  document.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      render();
    }),
  );
  window.addEventListener("spinner:preferences-cleared", () => {
    favorites.clear();
    render();
  });
  render();
})();
