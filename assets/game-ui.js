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
    "tetris.html": ["tetris", "Tetris", "OTHERS / UKŁADANKA"],
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
    document.querySelector('script[src$="game-ui.js"]').src,
  );
  const oldHeader = body.querySelector(":scope > header");
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
  if (!["arena", "incremental", "unity"].includes(kind) && parent !== window) {
    const report = () =>
      parent.postMessage(
        {
          type: "spinner:game-size",
          height: Math.ceil(
            (document.querySelector("main") || body).scrollHeight + 24,
          ),
        },
        location.origin,
      );
    new ResizeObserver(report).observe(document.querySelector("main") || body);
    report();
  }
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
