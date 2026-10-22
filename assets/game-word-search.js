(() => {
  "use strict";
  const H = SpinnerMore.create(["CZAS", "ZNALEZIONE", "KATEGORIA"]);
  H.board.classList.add("mo-word-search");
  const categories = {
    natura: [
      "LAS",
      "RZEKA",
      "ŁĄKA",
      "JEZIORO",
      "BRZOZA",
      "WIATR",
      "KAMIEŃ",
      "SOSNA",
    ],
    dom: [
      "OKNO",
      "LAMPA",
      "KRZESŁO",
      "KUCHNIA",
      "PÓŁKA",
      "SZUFLADA",
      "PODUSZKA",
      "DYWAN",
    ],
    droga: [
      "MOST",
      "SZLAK",
      "ROWER",
      "DWORZEC",
      "WAGON",
      "MAPA",
      "BILET",
      "PLECAK",
    ],
  };
  const categoryNames = { natura: "Natura", dom: "Dom", droga: "W drodze" },
    size = 10,
    directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
  let category = "natura",
    board = [],
    placements = [],
    found = new Set(),
    selected = -1,
    hinted = -1;
  H.select(
    "SŁOWA",
    Object.keys(categories).map((k) => [k, categoryNames[k]]),
    (v) => {
      category = v;
      newGame();
    },
  );
  H.button("Pokaż początek", hint);
  const list = document.createElement("div");
  list.className = "mo-words";
  H.extra.append(list);
  function generate(words) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const b = Array(size * size).fill(""),
        placed = [];
      let success = true;
      for (const word of [...words].sort((a, b) => b.length - a.length)) {
        const options = [];
        for (let r = 0; r < size; r++)
          for (let c = 0; c < size; c++)
            for (const [dr, dc] of directions) {
              const path = Array.from(word, (_, k) => [r + dr * k, c + dc * k]);
              if (
                path.some(([y, x]) => y < 0 || y >= size || x < 0 || x >= size)
              )
                continue;
              const cells = path.map(([y, x]) => y * size + x);
              if (cells.every((i, k) => !b[i] || b[i] === word[k]))
                options.push(cells);
            }
        if (!options.length) {
          success = false;
          break;
        }
        const cells = options[Math.floor(Math.random() * options.length)];
        cells.forEach((i, k) => (b[i] = word[k]));
        placed.push({ word, cells });
      }
      if (success) {
        const alphabet = "AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ";
        return {
          board: b.map(
            (v) => v || alphabet[Math.floor(Math.random() * alphabet.length)],
          ),
          placements: placed,
        };
      }
    }
    // Deterministic fallback still contains every word, one per row.
    const b = Array(size * size).fill("A"),
      placed = words.map((word, r) => ({
        word,
        cells: Array.from(word, (_, c) => r * size + c),
      }));
    for (const p of placed) p.cells.forEach((i, k) => (b[i] = p.word[k]));
    return { board: b, placements: placed };
  }
  function newGame() {
    const result = generate(categories[category]);
    board = result.board;
    placements = result.placements;
    found = new Set();
    selected = -1;
    hinted = -1;
    H.reset();
    H.say(
      "Wybierz pierwszą i ostatnią literę słowa. Szukaj także po skosie i od tyłu.",
    );
    render();
  }
  function choose(index) {
    if (
      !H.active() ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= board.length
    )
      return false;
    H.start();
    if (selected < 0) {
      selected = index;
      hinted = -1;
      H.say("Teraz wybierz ostatnią literę.");
    } else {
      const start = selected;
      selected = -1;
      const p = placements.find(
        (p) =>
          (p.cells[0] === start && p.cells.at(-1) === index) ||
          (p.cells[0] === index && p.cells.at(-1) === start),
      );
      if (p && !found.has(p.word)) {
        found.add(p.word);
        H.say(`Znalezione: ${p.word}.`);
        if (found.size === placements.length)
          H.finish(
            `Wszystkie osiem słów znalezione w ${SpinnerMore.time(H.elapsed)}.`,
          );
      } else
        H.say(
          p
            ? "To słowo jest już zaznaczone."
            : "Te końce nie wyznaczają szukanego słowa. Spróbuj ponownie.",
        );
    }
    render();
    return true;
  }
  function hint() {
    if (!H.active()) return;
    const p = placements.find((p) => !found.has(p.word));
    if (p) {
      hinted = p.cells[0];
      H.say(`Wyróżnione pole rozpoczyna słowo ${p.word}.`);
      render();
    }
  }
  function render() {
    const cells = new Set(
      placements.filter((p) => found.has(p.word)).flatMap((p) => p.cells),
    );
    H.grid(size, board, choose, (b, i) => {
      b.dataset.selected = String(i === selected || i === hinted);
      b.dataset.found = String(cells.has(i));
      b.setAttribute(
        "aria-label",
        `${board[i]}, rząd ${Math.floor(i / size) + 1}, kolumna ${(i % size) + 1}${cells.has(i) ? ", znalezione słowo" : ""}`,
      );
    });
    list.replaceChildren(
      ...categories[category].map((w) => {
        const e = document.createElement("span");
        e.textContent = w;
        e.dataset.found = String(found.has(w));
        return e;
      }),
    );
    H.stats([
      SpinnerMore.time(H.elapsed),
      `${found.size} / 8`,
      categoryNames[category],
    ]);
  }
  H.onPause = () => {
    selected = -1;
  };
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = () =>
    H.stats([
      SpinnerMore.time(H.elapsed),
      `${found.size} / 8`,
      categoryNames[category],
    ]);
  window.MoreGame = {
    newGame,
    choose,
    hint,
    generate,
    snapshot: () => ({
      board: [...board],
      placements: placements.map((p) => ({ ...p, cells: [...p.cells] })),
      found: [...found],
      selected,
      phase: H.phase,
    }),
  };
  newGame();
})();
