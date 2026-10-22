(() => {
  "use strict";
  const H = SpinnerMore.create(["CZAS", "WYPEŁNIONE", "OBRAZEK"]);
  const patterns = [
    ["Liść", ["00100", "01110", "11111", "00100", "00100"]],
    ["Kubek", ["00000", "11110", "10011", "10010", "11100"]],
    ["Dom", ["00100", "01110", "11111", "10101", "11111"]],
    ["Żagiel", ["00100", "01100", "11100", "00100", "11111"]],
    ["Schody", ["00001", "00011", "00111", "01111", "11111"]],
    [
      "Motyl",
      [
        "11000011",
        "11100111",
        "11111111",
        "01111110",
        "00111100",
        "01111110",
        "11100111",
        "11000011",
      ],
    ],
    [
      "Filiżanka",
      [
        "00000000",
        "11111100",
        "10000111",
        "10000101",
        "10000111",
        "01111000",
        "00000000",
        "11111111",
      ],
    ],
    [
      "Latarnia",
      [
        "00011000",
        "00111100",
        "00011000",
        "00011000",
        "00111100",
        "00111100",
        "01111110",
        "11111111",
      ],
    ],
  ];
  let index = 0,
    size = 5,
    solution = [],
    board = [],
    history = [],
    mode = "fill",
    assisted = false;
  const chooser = H.select(
    "OBRAZEK",
    patterns.map((p, i) => [i, `${i + 1} · ${p[1].length} × ${p[1].length}`]),
    (v) => {
      index = Number(v);
      newGame();
    },
  );
  const modeButton = H.button("Tryb: wypełniaj", () => {
    mode = mode === "fill" ? "cross" : "fill";
    modeButton.textContent =
      mode === "fill" ? "Tryb: wypełniaj" : "Tryb: oznacz ×";
    modeButton.setAttribute("aria-pressed", String(mode === "cross"));
  });
  const undoButton = H.button("Cofnij", undo);
  H.button("Sprawdź liczby", check);
  const wrapper = document.createElement("div");
  wrapper.className = "mo-nonogram";
  H.board.before(wrapper);
  const top = document.createElement("div"),
    side = document.createElement("div");
  top.className = "mo-clues-top";
  side.className = "mo-clues-side";
  wrapper.append(top, side, H.board);
  const runs = (line) => {
    const out = [];
    let n = 0;
    for (const value of [...line, 0]) {
      if (value === 1) n++;
      else if (n) {
        out.push(n);
        n = 0;
      }
    }
    return out.length ? out : [0];
  };
  const lines = (b, n) => [
    ...Array.from({ length: n }, (_, r) => b.slice(r * n, r * n + n)),
    ...Array.from({ length: n }, (_, c) =>
      Array.from({ length: n }, (_, r) => b[r * n + c]),
    ),
  ];
  const valid = (b, target, n) =>
    lines(b, n).every(
      (line, i) =>
        JSON.stringify(runs(line)) ===
        JSON.stringify(runs(lines(target, n)[i])),
    );
  function newGame() {
    size = patterns[index][1].length;
    solution = patterns[index][1].join("").split("").map(Number);
    board = Array(size * size).fill(0);
    history = [];
    assisted = false;
    H.reset();
    wrapper.style.setProperty("--cols", size);
    side.style.setProperty("--cols", size);
    top.replaceChildren(
      ...Array.from({ length: size }, (_, c) => {
        const e = document.createElement("span");
        e.textContent = runs(
          Array.from({ length: size }, (_, r) => solution[r * size + c]),
        ).join("\n");
        e.setAttribute(
          "aria-label",
          `Kolumna ${c + 1}: ${e.textContent.replaceAll("\n", ", ")}`,
        );
        return e;
      }),
    );
    side.replaceChildren(
      ...Array.from({ length: size }, (_, r) => {
        const e = document.createElement("span");
        e.textContent = runs(solution.slice(r * size, r * size + size)).join(
          " ",
        );
        e.setAttribute("aria-label", `Wiersz ${r + 1}: ${e.textContent}`);
        return e;
      }),
    );
    H.say("Liczby oznaczają długości grup. Pomiędzy grupami zostaw przerwę.");
    render();
  }
  function move(i, cross = mode === "cross") {
    if (!H.active() || !Number.isInteger(i) || i < 0 || i >= board.length)
      return false;
    H.start();
    history.push([...board]);
    const value = cross ? -1 : 1;
    board[i] = board[i] === value ? 0 : value;
    if (valid(board, solution, size))
      H.finish(
        `Obrazek gotowy: ${patterns[index][0]}. Wszystkie liczby się zgadzają.`,
      );
    render();
    return true;
  }
  function undo() {
    if (!history.length || H.phase === "paused") return;
    board = history.pop();
    H.reopen();
    H.say("Pole cofnięte.");
    render();
  }
  function check() {
    if (!H.active()) return;
    assisted = true;
    const right = lines(board, size).filter(
      (line, i) =>
        JSON.stringify(runs(line)) ===
        JSON.stringify(runs(lines(solution, size)[i])),
    ).length;
    H.say(
      `${right} z ${size * 2} wierszy i kolumn zgadza się z liczbami. Puste kratki możesz oznaczyć ×.`,
    );
  }
  function render() {
    H.grid(
      size,
      board.map((v) => (v === -1 ? "×" : "")),
      (i) => move(i),
      (b, i) => {
        b.dataset.on = String(board[i] === 1);
        b.setAttribute(
          "aria-label",
          `Rząd ${Math.floor(i / size) + 1}, kolumna ${(i % size) + 1}: ${board[i] === 1 ? "wypełnione" : board[i] === -1 ? "oznaczone puste" : "nieznane"}`,
        );
        b.oncontextmenu = (e) => {
          e.preventDefault();
          move(i, true);
        };
      },
    );
    H.stats([
      SpinnerMore.time(H.elapsed),
      board.filter((v) => v === 1).length,
      `${index + 1} / ${patterns.length}`,
    ]);
    undoButton.disabled = !history.length || H.phase === "paused";
  }
  H.keys((key, e) => {
    if (key.toLowerCase() === "u" && !e.repeat) {
      undo();
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = () =>
    H.stats([
      SpinnerMore.time(H.elapsed),
      board.filter((v) => v === 1).length,
      `${index + 1} / ${patterns.length}`,
    ]);
  window.MoreGame = {
    newGame,
    move,
    undo,
    runs,
    valid,
    patterns,
    snapshot: () => ({
      board: [...board],
      solution: [...solution],
      size,
      index,
      assisted,
      phase: H.phase,
    }),
  };
  newGame();
})();
