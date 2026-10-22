(() => {
  "use strict";
  const H = SpinnerMore.create(["CZAS", "PIONKI", "SKOKI"]);
  H.board.classList.add("mo-peg");
  const inside = (i) =>
    i >= 0 &&
    i < 49 &&
    ((Math.floor(i / 7) >= 2 && Math.floor(i / 7) <= 4) ||
      (i % 7 >= 2 && i % 7 <= 4));
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  let board = [],
    initial = [],
    certificate = [],
    selected = -1,
    moves = 0,
    history = [],
    target = 12;
  H.select(
    "WYZWANIE",
    [
      [12, "12 pionków"],
      [8, "8 pionków"],
      [20, "20 pionków"],
    ],
    (v) => {
      target = Number(v);
      newGame();
    },
  );
  const undoButton = H.button("Cofnij", undo);
  H.button("Powtórz układ", () => reset(initial));
  function jumps(b, reverse = false) {
    const result = [];
    for (let from = 0; from < 49; from++) {
      if (!inside(from) || b[from] !== 1) continue;
      const r = Math.floor(from / 7),
        c = from % 7;
      for (const [dr, dc] of directions) {
        const y = r + 2 * dr,
          x = c + 2 * dc;
        if (y < 0 || y >= 7 || x < 0 || x >= 7) continue;
        const mid = (r + dr) * 7 + c + dc,
          to = y * 7 + x;
        if (
          inside(mid) &&
          inside(to) &&
          b[to] === 0 &&
          b[mid] === (reverse ? 0 : 1)
        )
          result.push([from, mid, to]);
      }
    }
    return result;
  }
  function newGame() {
    let best = [],
      path = [];
    for (let attempt = 0; attempt < 100; attempt++) {
      const b = Array.from({ length: 49 }, (_, i) => (inside(i) ? 0 : -1)),
        p = [];
      b[24] = 1;
      for (let k = 1; k < target; k++) {
        const legal = jumps(b, true);
        if (!legal.length) break;
        const [from, mid, to] = legal[Math.floor(Math.random() * legal.length)];
        b[from] = 0;
        b[mid] = b[to] = 1;
        p.push([to, mid, from]);
      }
      if (p.length > path.length) {
        best = b;
        path = p;
      }
      if (p.length === target - 1) break;
    }
    // A certified construction also covers a constant or pathological RNG.
    if (path.length < target - 1) {
      const construction = [
        [24, 25, 26],
        [25, 18, 11],
        [18, 17, 16],
        [17, 24, 31],
        [16, 17, 18],
        [11, 10, 9],
        [18, 25, 32],
        [31, 30, 29],
        [30, 23, 16],
        [17, 18, 19],
        [24, 31, 38],
        [32, 39, 46],
        [23, 22, 21],
        [46, 45, 44],
        [16, 15, 14],
        [10, 17, 24],
        [9, 16, 23],
        [23, 30, 37],
        [18, 11, 4],
      ];
      best = Array.from({ length: 49 }, (_, i) => (inside(i) ? 0 : -1));
      best[24] = 1;
      path = [];
      for (const [from, middle, to] of construction.slice(0, target - 1)) {
        best[from] = 0;
        best[middle] = best[to] = 1;
        path.push([to, middle, from]);
      }
    }
    board = [...best];
    initial = [...best];
    certificate = path.reverse();
    reset(board);
  }
  function reset(b) {
    board = [...b];
    history = [];
    selected = -1;
    moves = 0;
    H.reset();
    H.say("Wybierz pionek i puste pole za sąsiadem. Zostaw jeden pionek.");
    render();
  }
  function move(from, to) {
    if (!H.active()) return false;
    const jump = jumps(board).find((j) => j[0] === from && j[2] === to);
    if (!jump) return false;
    H.start();
    history.push([...board]);
    board[from] = board[jump[1]] = 0;
    board[to] = 1;
    moves++;
    selected = -1;
    const left = board.filter((v) => v === 1).length;
    if (left === 1) H.finish(`Został jeden pionek. ${moves} dobrych skoków!`);
    else if (!jumps(board).length)
      H.say(
        `Brak skoków. Zostało ${left} pionków. Cofnij ruch lub powtórz układ.`,
        "error",
      );
    else H.say("Jeden pionek mniej. Spójrz na następny skok.");
    render();
    return true;
  }
  function choose(i) {
    if (!H.active() || !inside(i)) return;
    if (board[i] === 1) selected = selected === i ? -1 : i;
    else if (selected >= 0) move(selected, i);
    render();
  }
  function undo() {
    if (!history.length || H.phase === "paused") return;
    board = history.pop();
    moves--;
    selected = -1;
    H.reopen();
    H.say("Skok cofnięty.");
    render();
  }
  function render() {
    const legal = jumps(board)
      .filter((j) => j[0] === selected)
      .map((j) => j[2]);
    H.grid(
      7,
      board.map((v) => (v === 1 ? "●" : "")),
      choose,
      (b, i) => {
        b.dataset.outside = String(!inside(i));
        b.disabled = !inside(i);
        b.dataset.peg = String(board[i] === 1);
        b.dataset.selected = String(i === selected);
        b.dataset.legal = String(legal.includes(i));
        b.setAttribute(
          "aria-label",
          `Rząd ${Math.floor(i / 7) + 1}, kolumna ${(i % 7) + 1}: ${board[i] === 1 ? "pionek" : "puste pole"}`,
        );
      },
    );
    H.stats([
      SpinnerMore.time(H.elapsed),
      board.filter((v) => v === 1).length,
      moves,
    ]);
    undoButton.disabled = !history.length || H.phase === "paused";
  }
  H.keys((key, e) => {
    if (key.toLowerCase() === "u" && !e.repeat) {
      undo();
      return true;
    }
  });
  H.onRender = render;
  H.onNew = newGame;
  H.onTick = () =>
    H.stats([
      SpinnerMore.time(H.elapsed),
      board.filter((v) => v === 1).length,
      moves,
    ]);
  window.MoreGame = {
    newGame,
    move,
    choose,
    undo,
    jumps,
    inside,
    snapshot: () => ({
      board: [...board],
      initial: [...initial],
      certificate: certificate.map((j) => [...j]),
      moves,
      selected,
      phase: H.phase,
    }),
  };
  newGame();
})();
