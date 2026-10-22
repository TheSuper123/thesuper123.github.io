(() => {
  "use strict";
  const H = SpinnerMore.create(["CZAS", "NACIŚNIĘCIA", "ŚWIATŁA"]);
  let size = 5,
    board = [],
    moves = 0,
    history = [],
    hinted = -1;
  H.select(
    "PLANSZA",
    [
      [5, "5 × 5"],
      [4, "4 × 4"],
    ],
    (v) => {
      size = Number(v);
      newGame();
    },
  );
  const undoButton = H.button("Cofnij", undo);
  H.button("Podpowiedź", hint);
  const neighbors = (i, n = size) =>
    [i, i - n, i + n, i % n ? i - 1 : -1, i % n < n - 1 ? i + 1 : -1].filter(
      (j) => j >= 0 && j < n * n,
    );
  function solve(values, n = size) {
    const count = n * n,
      rows = values.map(
        (v, i) =>
          neighbors(i, n).reduce((mask, j) => mask | (1 << j), 0) |
          (v ? 1 << count : 0),
      ),
      pivots = [];
    let row = 0;
    for (let col = 0; col < count && row < count; col++) {
      const found = rows.findIndex((v, i) => i >= row && v & (1 << col));
      if (found < 0) continue;
      [rows[row], rows[found]] = [rows[found], rows[row]];
      for (let r = 0; r < count; r++)
        if (r !== row && rows[r] & (1 << col)) rows[r] ^= rows[row];
      pivots.push(col);
      row++;
    }
    if (rows.some((v) => (v & ((1 << count) - 1)) === 0 && v & (1 << count)))
      return null;
    return pivots.filter((_, r) => Boolean(rows[r] & (1 << count)));
  }
  function newGame() {
    board = Array(size * size).fill(0);
    for (let i = 0; i < board.length; i++)
      if (Math.random() < 0.45) for (const j of neighbors(i)) board[j] ^= 1;
    if (!board.some(Boolean))
      for (const j of neighbors(Math.floor(board.length / 2))) board[j] ^= 1;
    moves = 0;
    history = [];
    hinted = -1;
    H.reset();
    H.record("lights:" + size);
    H.say("Zgaś wszystkie pola. Każde naciśnięcie zmienia też sąsiadów.");
    render();
  }
  function move(i) {
    if (!H.active() || !Number.isInteger(i) || i < 0 || i >= board.length)
      return false;
    H.start();
    history.push([...board]);
    for (const j of neighbors(i)) board[j] ^= 1;
    moves++;
    hinted = -1;
    if (!board.some(Boolean)) {
      H.record("lights:" + size, moves, true);
      H.finish(`Wszystkie światła zgaszone. ${moves} naciśnięć.`);
    }
    render();
    return true;
  }
  function undo() {
    if (!history.length || H.phase === "paused") return;
    board = history.pop();
    moves--;
    hinted = -1;
    H.reopen();
    render();
  }
  function hint() {
    if (!H.active()) return;
    hinted = solve(board)?.[0] ?? -1;
    H.say("Naciśnij wyróżnione pole. Podpowiedź uwzględnia aktualny układ.");
    render();
  }
  function render() {
    H.grid(
      size,
      board.map((v) => (v ? "●" : "○")),
      move,
      (b, i) => {
        b.dataset.on = String(Boolean(board[i]));
        b.dataset.selected = String(i === hinted);
        b.setAttribute(
          "aria-label",
          `Rząd ${Math.floor(i / size) + 1}, kolumna ${(i % size) + 1}: ${board[i] ? "świeci" : "zgaszone"}`,
        );
      },
    );
    H.stats([
      SpinnerMore.time(H.elapsed),
      moves,
      board.reduce((a, v) => a + v, 0),
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
      moves,
      board.reduce((a, v) => a + v, 0),
    ]);
  window.MoreGame = {
    newGame,
    move,
    undo,
    hint,
    solve,
    neighbors,
    snapshot: () => ({
      board: [...board],
      size,
      moves,
      hinted,
      phase: H.phase,
    }),
  };
  newGame();
})();
