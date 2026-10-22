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
