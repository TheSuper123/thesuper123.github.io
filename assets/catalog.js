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
        fold(game.name + " " + game.desc).includes(query),
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
