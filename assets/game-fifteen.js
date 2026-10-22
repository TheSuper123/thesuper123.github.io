(() => {
  "use strict";
  const H = SpinnerMore.create(["CZAS", "RUCHY", "DO CELU"]);
  let size = 4,
    tiles = [],
    initial = [],
    history = [],
    moves = 0,
    hinted = -1,
    certificate = [];
  H.board.dataset.navigation = "game";
  H.select(
    "PLANSZA",
    [
      [4, "4 × 4 · piętnastka"],
      [3, "3 × 3 · ósemka"],
    ],
    (v) => {
      size = Number(v);
      newGame();
    },
  );
  const undoButton = H.button("Cofnij", undo);
  H.button("Wskazówka", hint);
  H.button("Powtórz układ", () => reset(initial));
  const adjacent = (a, b) =>
    Math.abs(Math.floor(a / size) - Math.floor(b / size)) +
      Math.abs((a % size) - (b % size)) ===
    1;
  const distance = (board) =>
    board.reduce(
      (sum, v, i) =>
        sum +
        (v
          ? Math.abs(Math.floor(i / size) - Math.floor((v - 1) / size)) +
            Math.abs((i % size) - ((v - 1) % size))
          : 0),
      0,
    );
  function reset(board) {
    tiles = [...board];
    history = [];
    moves = 0;
    hinted = -1;
    H.reset();
    H.record("fifteen:" + size);
    H.say("Przesuń kafelek obok pustego pola.");
    render();
  }
  function newGame() {
    const board = Array.from(
        { length: size * size },
        (_, i) => (i + 1) % (size * size),
      ),
      back = [];
    let empty = board.length - 1,
      previous = -1;
    for (let k = 0; k < size * size * 12; k++) {
      const options = board
          .map((_, i) => i)
          .filter((i) => i !== previous && adjacent(empty, i)),
        next = options[Math.floor(Math.random() * options.length)];
      back.push(empty);
      [board[empty], board[next]] = [board[next], board[empty]];
      previous = empty;
      empty = next;
    }
    if (!distance(board)) {
      const next = empty === 0 ? 1 : empty - 1;
      back.push(empty);
      [board[empty], board[next]] = [board[next], board[empty]];
    }
    certificate = back.reverse();
    initial = [...board];
    reset(board);
  }
  function move(index) {
    if (
      !H.active() ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= tiles.length
    )
      return false;
    const empty = tiles.indexOf(0);
    if (!adjacent(index, empty)) return false;
    H.start();
    history.push([...tiles]);
    [tiles[empty], tiles[index]] = [tiles[index], tiles[empty]];
    moves++;
    hinted = -1;
    if (!distance(tiles)) {
      H.record("fifteen:" + size, moves, true);
      H.finish(
        `Wszystko po kolei! ${moves} ruchów, ${SpinnerMore.time(H.elapsed)}.`,
      );
    } else H.say("Każdy kafelek ma docelowe miejsce.");
    render();
    return true;
  }
  function undo() {
    if (!history.length || H.phase === "paused") return;
    tiles = history.pop();
    moves--;
    hinted = -1;
    H.reopen();
    H.say("Ostatni ruch cofnięty.");
    render();
  }
  function hint() {
    if (!H.active()) return;
    const empty = tiles.indexOf(0),
      before = history.at(-1);
    let best = Infinity;
    for (let i = 0; i < tiles.length; i++) {
      if (!adjacent(empty, i)) continue;
      const candidate = [...tiles];
      [candidate[i], candidate[empty]] = [candidate[empty], candidate[i]];
      let value = distance(candidate);
      if (before && candidate.every((v, j) => v === before[j])) value += 3;
      if (value < best) {
        best = value;
        hinted = i;
      }
    }
    H.say(
      "Wyróżniony kafelek to wskazówka według odległości od celu. Czasem trzeba zrobić miejsce innym liczbom.",
    );
    render();
  }
  function render() {
    H.grid(
      size,
      tiles.map((v) => (v ? String(v) : "")),
      move,
      (b, i) => {
        b.dataset.empty = String(!tiles[i]);
        b.dataset.selected = String(i === hinted);
        b.setAttribute(
          "aria-label",
          tiles[i] ? `Kafelek ${tiles[i]}` : "Puste pole",
        );
      },
    );
    H.stats([SpinnerMore.time(H.elapsed), moves, distance(tiles)]);
    undoButton.disabled = !history.length || H.phase === "paused";
  }
  H.keys((key, e) => {
    const d = {
      ArrowLeft: -1,
      a: -1,
      ArrowRight: 1,
      d: 1,
      ArrowUp: -size,
      w: -size,
      ArrowDown: size,
      s: size,
    }[key];
    if (d) {
      const empty = tiles.indexOf(0),
        next = empty + d;
      if (next >= 0 && next < tiles.length && adjacent(empty, next)) move(next);
      return true;
    }
    if (key.toLowerCase() === "u" && !e.repeat) {
      undo();
      return true;
    }
  });
  H.onRender = render;
  H.onTick = () =>
    H.stats([SpinnerMore.time(H.elapsed), moves, distance(tiles)]);
  H.onNew = newGame;
  window.MoreGame = {
    newGame,
    move,
    undo,
    hint,
    distance,
    snapshot: () => ({
      board: [...tiles],
      size,
      moves,
      phase: H.phase,
      hinted,
      certificate: [...certificate],
      initial: [...initial],
    }),
  };
  newGame();
})();
