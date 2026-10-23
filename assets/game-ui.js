(() => {
  "use strict";
  const body = document.body;
  if (self !== top) document.documentElement.classList.add("embedded");
  body.classList.add("game-page");
  const file = location.pathname.split("/").pop();
  const kinds = {
    "neonsnake1.html": ["snake", "Snake", "01 / ZRĘCZNOŚĆ"],
    "saper.html": ["saper", "Saper", "02 / GŁÓWKOWANIE"],
    "tictactoe.html": ["tictactoe", "Kółko i krzyżyk", "03 / DLA DWÓCH"],
    "neonmaze.html": ["maze", "Labirynt", "04 / ORIENTACJA"],
    "geometry-game.html": ["geometry", "Geometry Run", "05 / REFLEKS"],
    "snake.html": ["arena", "Snake Arena", "06 / ARENA Z BOTAMI"],
    "flappy.html": ["little-flight", "Mały lot", "08 / ZRĘCZNOŚĆ"],
    "2048.html": ["2048", "2048", "09 / LICZBY W RUCHU"],
    "memory.html": ["memory", "Memory", "10 / DOBRA PAMIĘĆ"],
    "breakout.html": ["breakout", "Paletka", "11 / DOBRE ODBICIE"],
    "sudoku.html": ["sudoku", "Sudoku", "12 / DZIEWIĘĆ NA DZIEWIĘĆ"],
    "sokoban.html": ["sokoban", "Skrzynki", "13 / MYŚL O KROK DALEJ"],
    "connect-four.html": [
      "connect-four",
      "Cztery w rzędzie",
      "14 / RUCH PO RUCHU",
    ],
    "reversi.html": ["reversi", "Reversi", "15 / ODWRÓĆ SYTUACJĘ"],
    "dots-boxes.html": [
      "dots-boxes",
      "Kropki i kreski",
      "16 / DOMKNIJ KWADRAT",
    ],
    "mancala.html": ["mancala", "Kalaha", "17 / SIEJ I ZBIERAJ"],
    "fifteen.html": ["fifteen", "Piętnastka", "18 / JEDNO WOLNE POLE"],
    "lights-out.html": ["lights-out", "Zgaś światła", "19 / EFEKT SĄSIADA"],
    "nonogram.html": ["nonogram", "Nonogram", "20 / OBRAZ Z LICZB"],
    "hanoi.html": ["hanoi", "Wieże Hanoi", "21 / PRZENIEŚ STOS"],
    "peg-solitaire.html": ["peg-solitaire", "Samotnik", "22 / ZOSTAŃ JEDEN"],
    "codebreaker.html": ["codebreaker", "Łamacz kodu", "23 / CZTERY ZNAKI"],
    "word-search.html": ["word-search", "Wykreślanka", "24 / MIĘDZY LITERAMI"],
    "word-guess.html": [
      "word-guess",
      "Litera po literze",
      "25 / SŁOWO NA DZIŚ?",
    ],
    "echo.html": ["echo", "Echo", "26 / POWTÓRZ RYTM"],
    "moles.html": ["moles", "Kretowisko", "27 / TRAF W MOMENT"],
    "pong.html": ["pong", "Pojedynek", "28 / DRUGA STRONA STOŁU"],
    "orbit.html": ["orbit", "Orbita", "29 / MAŁY STATEK, DUŻO MIEJSCA"],
    "stack.html": ["stack", "Wieża", "30 / ZŁAP TEN PION"],
    "checkers.html": ["checkers", "Warcaby", "31 / BIJ I AWANSUJ"],
    "hex.html": ["hex", "Mosty Hex", "32 / POŁĄCZ BRZEGI"],
    "morris.html": ["morris", "Młynek", "33 / TRZY, POTEM RUCH"],
    "battleships.html": ["battleships", "Okręty", "34 / SZUKAJ NA WODZIE"],
    "domino.html": ["domino", "Domino", "35 / DOPASUJ KONIEC"],
    "solitaire.html": ["solitaire", "Pasjans", "36 / PORZĄDEK W KARTACH"],
    "freecell.html": [
      "freecell",
      "Wolne komórki",
      "37 / CZTERY MIEJSCA ZAPASU",
    ],
    "golf.html": ["golf", "Golf karciany", "38 / O JEDNO OCZKO"],
    "dice.html": ["dice", "Kości", "39 / PIĘĆ KOŚCI"],
    "nim.html": ["nim", "Nim", "40 / JEDEN STOS NA TURĘ"],
    "chomp.html": ["chomp", "Ostatni kęs", "41 / OMIŃ NAROŻNIK"],
    "amazons.html": ["amazons", "Amazonki", "42 / ZOSTAW SOBIE PRZEJŚCIE"],
    "takuzu.html": ["takuzu", "Równowaga", "43 / POŁOWA ZER, POŁOWA JEDYNEK"],
    "futoshiki.html": [
      "futoshiki",
      "Mniejsze większe",
      "44 / CYFRY I NIERÓWNOŚCI",
    ],
    "skyscrapers.html": ["skyscrapers", "Wieżowce", "45 / WIDOK OD ULICY"],
    "cages.html": ["cages", "Klatki liczbowe", "46 / LICZBY WE WSPÓŁPRACY"],
    "shikaku.html": ["shikaku", "Prostokąty", "47 / PODZIEL CAŁĄ PLANSZĘ"],
    "bridges.html": ["bridges", "Wyspy i mosty", "48 / POŁĄCZ ARCHIPELAG"],
    "untangle.html": ["untangle", "Rozplącz", "49 / LINIE BEZ KOLIZJI"],
    "loop.html": ["loop", "Zamknij pętlę", "50 / JEDNA LINIA DOOKOŁA"],
    "invaders.html": ["invaders", "Najeźdźcy", "51 / TRZY FALE"],
    "crossing.html": ["crossing", "Przeprawa", "52 / DRUGI BRZEG"],
    "racer.html": ["racer", "Zakręt", "53 / TRZY PASY"],
    "platformer.html": ["platformer", "Platformy", "54 / SKOK PO KLUCZ"],
    "lander.html": ["lander", "Lądownik", "55 / SPOKOJNIE DO ZIEMI"],
    "pinball.html": ["pinball", "Flipper", "56 / JESZCZE JEDNO ODBICIE"],
    "archery.html": ["archery", "Łucznik", "57 / DZIESIĘĆ STRZAŁ"],
    "billiards.html": ["billiards", "Bilard", "58 / SZEŚĆ BIL DO ŁUZ"],
    "rhythm.html": ["rhythm", "Cztery takty", "59 / RYTM W OCZACH"],
    "balance.html": ["balance", "Balans", "60 / OSIEM PUNKTÓW"],
    "chess.html": ["chess", "Szachy", "61 / KRÓL POD OCHRONĄ"],
    "go.html": ["go", "Go", "62 / ODDECHY I TERYTORIUM"],
    "backgammon.html": ["backgammon", "Tryktrak", "63 / PIĘTNAŚCIE DO DOMU"],
    "pentago.html": ["pentago", "Obróć pięć", "64 / ĆWIERĆ OBROTU"],
    "gomoku.html": ["gomoku", "Gomoku", "65 / PIĘĆ W RZĘDZIE"],
    "ataxx.html": ["ataxx", "Ataxx", "66 / SKOPIUJ I PRZEJMIJ"],
    "konane.html": ["konane", "Konane", "67 / SKOK PRZEZ RYWALA"],
    "fox-geese.html": ["fox-geese", "Lis i gęsi", "68 / JEDEN PRZECIW STADU"],
    "kakuro.html": ["kakuro", "Kakuro", "69 / SUMY BEZ POWTÓREK"],
    "nurikabe.html": ["nurikabe", "Nurikabe", "70 / WYSPY W MORZU"],
    "kuromasu.html": ["kuromasu", "Kuromasu", "71 / WIDOK OD LICZBY"],
    "hitori.html": ["hitori", "Hitori", "72 / SKREŚL POWTÓRZENIA"],
    "star-battle.html": [
      "star-battle",
      "Gwiezdne regiony",
      "73 / JEDNA W KAŻDYM",
    ],
    "tents.html": ["tents", "Namioty", "74 / OBÓZ PRZY DRZEWACH"],
    "fleet-puzzle.html": [
      "fleet-puzzle",
      "Ukryta flota",
      "75 / OKRĘTY Z LICZB",
    ],
    "akari.html": ["akari", "Latarnie", "76 / ŚWIATŁO BEZ KOLIZJI"],
    "netwalk.html": ["netwalk", "Rurociąg", "77 / POŁĄCZ CAŁĄ SIEĆ"],
    "rush-hour.html": ["rush-hour", "Wyjazd", "78 / ZRÓB MIEJSCE"],
    "knight-tour.html": [
      "knight-tour",
      "Droga skoczka",
      "79 / TRZYDZIEŚCI SZEŚĆ SKOKÓW",
    ],
    "eight-queens.html": [
      "eight-queens",
      "Osiem hetmanów",
      "80 / OSOBNE PRZEKĄTNE",
    ],
    "paths.html": ["paths", "Sześć ścieżek", "81 / POŁĄCZ PARY"],
    "polyomino.html": ["polyomino", "Pięć pól", "82 / SZEŚĆ WŁASNYCH FIGUR"],
    "twenty-four.html": ["twenty-four", "Dokładnie 24", "83 / CZTERY LICZBY"],
    "cryptogram.html": ["cryptogram", "Szyfrogram", "84 / PODSTAW LITERY"],
    "typing.html": ["typing", "Maszynopis", "85 / MINUTA NA TEKST"],
    "stroop.html": ["stroop", "Kolor słowa", "86 / ODRUCH POD KONTROLĄ"],
    "mental-math.html": [
      "mental-math",
      "Rachunek w głowie",
      "87 / DWADZIEŚCIA DZIAŁAŃ",
    ],
    "capitals.html": ["capitals", "Stolice", "88 / PIĘTNAŚCIE PODRÓŻY"],
    "asteroids.html": [
      "asteroids",
      "Pas asteroid",
      "89 / BEZWŁADNOŚĆ W KOSMOSIE",
    ],
    "artillery.html": ["artillery", "Artyleria", "90 / POJEDYNEK NA WZGÓRZACH"],
    "curling.html": ["curling", "Curling", "91 / KAMIENIE DO DOMU"],
    "minigolf.html": ["minigolf", "Minigolf", "92 / TRZY AUTORSKIE TORY"],
    "bowling.html": ["bowling", "Kręgle", "93 / DZIESIĘĆ RUND"],
    "darts.html": ["darts", "Rzutki 501", "94 / ZAMKNIJ PODWÓJNĄ"],
    "helicopter.html": ["helicopter", "Jaskinia", "95 / CIĄGŁY LOT"],
    "tower-defense.html": ["tower-defense", "Obrona trasy", "96 / PIĘĆ FAL"],
    "fishing.html": ["fishing", "Na ryby", "97 / NAPNIJ I POLUZUJ"],
    "skiing.html": ["skiing", "Slalom", "98 / DWADZIEŚCIA BRAMEK"],
    "volleyball.html": ["volleyball", "Siatkówka", "99 / PIŁKA NAD SIATKĄ"],
    "political-compass.html": [
      "political-compass",
      "Kompas polityczny",
      "100 / PIĘĆ OSI POGLĄDÓW",
    ],
    "tetris.html": ["tetris", "Tetris", "OTHERS / UKŁADANKA"],
    "last-watch.html": ["last-watch", "Ostatnia warta", "101 / BOSSFIGHT"],
    "flappybird.html": ["bird", "Flappy Bird", "OTHERS / ZRĘCZNOŚĆ"],
    "blockblast.html": ["blocks", "Block Blast", "OTHERS / UKŁADANKA"],
    "doom.html": ["doom", "Doom HTML", "OTHERS / EKSPERYMENT"],
    "geometrydashlite986.html": [
      "unity",
      "Geometry Dash Lite",
      "OTHERS / UNITY",
    ],
    "skibidifish.html": ["fish", "Poradnik wędkarski", "OTHERS / Z ARCHIWUM"],
    "neonincremental1.html": [
      "incremental",
      "Przekaźnik",
      "EKSPERYMENT / ROZWÓJ",
    ],
    "quiz.html": ["quiz", "Quiz opinii", "Z ARCHIWUM / QUIZ"],
    "polls.html": ["polls", "Sondaże", "Z ARCHIWUM / INFORMACJE"],
    "soon.html": ["soon", "Jeszcze chwila", "SALON / ZAPOWIEDŹ"],
  };
  let [kind, title, label] = kinds[file] || [
    "game",
    "Spinner Games",
    "SALON / GRA",
  ];
  if (file === "saper.html" && !location.pathname.includes("/games/")) {
    kind = "saper-classic";
    title = "Saper / edycja klasyczna";
    label = "07 / Z ARCHIWUM";
  }
  body.dataset.game = kind;
  const base = new URL(
    "../",
    document.querySelector('script[src*="game-ui.js"]').src,
  );
  const oldHeader = body.querySelector(":scope > header");
  const viewportStyle = document.createElement("link");
  viewportStyle.rel = "stylesheet";
  viewportStyle.href = new URL("assets/game-viewport.css?v=100", base);
  document.head.append(viewportStyle);
  const viewportScript = document.createElement("script");
  viewportScript.src = new URL("assets/game-viewport.js?v=100", base);
  // Deferred game engines may still be initializing while readyState is
  // "interactive". Move their real controls only after that entire queue.
  if (document.readyState === "loading" || document.currentScript?.defer)
    document.addEventListener(
      "DOMContentLoaded",
      () => document.head.append(viewportScript),
      { once: true },
    );
  else document.head.append(viewportScript);
  const legacy = document.createElement("div");
  legacy.className = "legacy-status";
  if (oldHeader) {
    while (oldHeader.firstChild) legacy.append(oldHeader.firstChild);
    oldHeader.remove();
  }
  const header = document.createElement("header");
  header.className = "game-header";
  const home = new URL("index.html", base);
  header.innerHTML = `<a class="brand" href="${home.href}"><img src="${new URL("assets/mark.svg", base).href}" width="30" height="30" alt=""><span>spinner<span class="brand-sub">MAŁA PRZERWA. DOBRA GRA.</span></span></a><div class="game-header-actions"><a class="game-exit" href="${home.href}">← Katalog</a></div>`;
  header.append(legacy);
  body.prepend(header);
  const heading = document.createElement("div");
  heading.className = "game-heading";
  const caption = document.createElement("div");
  const kicker = document.createElement("div");
  kicker.className = "eyebrow";
  kicker.textContent = label;
  const h1 = document.createElement("h1");
  h1.textContent = title;
  caption.append(kicker, h1);
  const symbol = document.createElement("span");
  symbol.className = "game-index";
  symbol.setAttribute("aria-hidden", "true");
  symbol.innerHTML =
    '<svg viewBox="0 0 40 40" width="30" height="30"><path d="M20 3v34M3 20h34M8 8l24 24M8 32 32 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  heading.append(caption, symbol);
  header.after(heading);
  document
    .querySelectorAll(
      ".legacy-status #user-display,.legacy-status #user-name,.legacy-status #user-info",
    )
    .forEach((el) => (el.textContent = "Grasz lokalnie"));
  document
    .querySelectorAll("#sync-display,.sync-status")
    .forEach((el) => (el.textContent = "Zapis na urządzeniu"));
  let footer = body.querySelector(":scope > footer");
  if (!footer) {
    footer = document.createElement("footer");
    body.append(footer);
  }
  footer.innerHTML =
    "Spinner Games · <button data-cookie-settings>Ustawienia prywatności</button>";
  // Root-level classic saper gets a cabinet instead of a disconnected fullscreen form.
  if (kind === "saper-classic" && !body.querySelector("main")) {
    const main = document.createElement("main"),
      card = document.createElement("div");
    card.className = "card";
    for (const id of ["menu", "game", "controls"]) {
      const el = document.getElementById(id);
      if (el) card.append(el);
    }
    main.append(card);
    heading.after(main);
    body.querySelector(":scope > .logo")?.remove();
  }
  // Ensure selects, numeric inputs and canvas controls have usable accessible names.
  const labels = {
    "map-select": "Wielkość planszy",
    difficulty: "Poziom trudności",
    "difficulty-select": "Poziom trudności",
    "grid-size": "Rozmiar planszy",
    "bomb-count": "Liczba min",
    nickInput: "Nazwa gracza",
  };
  for (const [id, text] of Object.entries(labels)) {
    const control = document.getElementById(id);
    if (control && !control.hasAttribute("aria-label"))
      control.setAttribute("aria-label", text);
  }
  document.querySelectorAll("canvas:not(#minimapCanvas)").forEach((canvas) => {
    if (!canvas.hasAttribute("aria-label"))
      canvas.setAttribute("aria-label", title + " — plansza gry");
    if (!canvas.hasAttribute("tabindex")) canvas.tabIndex = 0;
  });
  document.querySelectorAll("button.ctrl-btn,.joy-btn").forEach((el) => {
    const symbol = el.textContent.trim();
    const text = {
      "▲": "W górę",
      "▼": "W dół",
      "◀": "W lewo",
      "▶": "W prawo",
      "↻": "Obróć",
    }[symbol];
    if (text) {
      el.setAttribute("aria-label", text);
      if (symbol !== "↻") {
        const angle = { "▲": 0, "▶": 90, "▼": 180, "◀": 270 }[symbol];
        el.innerHTML = `<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" style="transform:rotate(${angle}deg)"><path d="M10 4 16 14H4Z" fill="currentColor"/></svg>`;
      }
    }
  });
  const board = document.querySelector("#game:not(canvas)");
  if (
    board &&
    !board.hasAttribute("data-managed-controls") &&
    ["saper", "saper-classic"].includes(kind)
  ) {
    const accessible = () =>
      board.querySelectorAll(".cell").forEach((cell, i) => {
        cell.tabIndex = 0;
        cell.setAttribute("role", "button");
        cell.setAttribute(
          "aria-label",
          "Pole " + (i + 1) + (cell.textContent ? ": " + cell.textContent : ""),
        );
        if (!cell.dataset.keyboard) {
          cell.dataset.keyboard = "1";
          cell.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              cell.click();
            }
          });
        }
      });
    accessible();
    new MutationObserver(accessible).observe(board, { childList: true });
  }
  function recolor() {
    document.querySelectorAll("[style]").forEach((el) => {
      for (const property of ["color", "backgroundColor", "borderColor"]) {
        const value = el.style[property];
        if (value) {
          const next = SpinnerTheme.color(value);
          if (next !== value) el.style[property] = next;
        }
      }
    });
    if (typeof window.SpinnerGame?.render === "function") {
      window.SpinnerGame.render();
      return;
    }
    if (typeof drawBoard === "function") {
      drawBoard();
      if (typeof p !== "undefined" && p?.draw) p.draw();
    }
    if (typeof paintSnake === "function") paintSnake();
    if (typeof engine !== "undefined" && engine?.draw) engine.draw();
  }
  window.addEventListener("spinner:theme-change", recolor);
  recolor();
  // A pointer gesture transfers keyboard control to this game, without scrolling
  // the outer catalog or stealing focus from difficulty and text inputs.
  const focusGame = () => {
    const target = document.querySelector(
      "canvas:not(#minimapCanvas), [data-game-focus], [data-managed-controls]",
    );
    target?.focus({ preventScroll: true });
  };
  window.SpinnerGameFocus = focusGame;
  if (window.SpinnerGame && !window.SpinnerGame.focus)
    window.SpinnerGame.focus = focusGame;
  document.querySelectorAll("canvas:not(#minimapCanvas)").forEach((canvas) => {
    canvas.addEventListener(
      "pointerdown",
      () => canvas.focus({ preventScroll: true }),
      { passive: true },
    );
  });
  if (kind === "geometry")
    document.querySelectorAll(".diff-card").forEach((card) => {
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          card.click();
        }
      });
    });
})();
