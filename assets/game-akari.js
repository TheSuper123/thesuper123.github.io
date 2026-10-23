(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6;
  function rays(walls, i) {
    const cells = [i],
      r = Math.floor(i / n),
      c = i % n;
    for (const [dy, dx] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      let y = r + dy,
        x = c + dx;
      while (y >= 0 && y < 6 && x >= 0 && x < 6 && walls[y * 6 + x] === null) {
        cells.push(y * 6 + x);
        y += dy;
        x += dx;
      }
    }
    return cells;
  }
  function valid(s) {
    const lit = new Set();
    for (let i = 0; i < 36; i++)
      if (s.walls[i] === null && s.board[i] === 1) {
        const cells = rays(s.walls, i);
        if (cells.some((j) => j !== i && s.board[j] === 1)) return false;
        cells.forEach((j) => lit.add(j));
      }
    return s.walls.every((v, i) =>
      v === null
        ? lit.has(i)
        : v < 0 ||
          S.neighbors(i, n).filter((j) => s.board[j] === 1).length === v,
    );
  }
  S.puzzle({
    n,
    goal: "OŚWIETL CAŁOŚĆ",
    tools: [
      [1, "Lampa"],
      [-1, "Wyklucz"],
      [0, "×"],
    ],
    initial() {
      const walls = Array.from({ length: 36 }, () =>
          Math.random() < 0.25 ? -1 : null,
        ),
        solution = Array(36).fill(0),
        lit = new Set();
      if (walls.every((v) => v !== null)) walls[0] = null;
      for (const i of S.shuffle([...Array(36).keys()]))
        if (walls[i] === null && !lit.has(i)) {
          solution[i] = 1;
          rays(walls, i).forEach((j) => lit.add(j));
        }
      for (let i = 0; i < 36; i++)
        if (walls[i] !== null && Math.random() < 0.85)
          walls[i] = S.neighbors(i, n).filter((j) => solution[j] === 1).length;
      return {
        board: Array(36).fill(0),
        walls,
        solution,
        fixed: walls.map((v) => v !== null),
        moves: 0,
      };
    },
    valid,
    text: (s, i) =>
      s.walls[i] !== null
        ? s.walls[i] < 0
          ? ""
          : s.walls[i]
        : s.board[i] === 1
          ? "☼"
          : s.board[i] === -1
            ? "×"
            : "",
    decorate(b, i, s) {
      if (s.walls[i] !== null) b.classList.add("hu-black");
      else if (s.board.some((v, j) => v === 1 && rays(s.walls, j).includes(i)))
        b.style.background = "color-mix(in srgb,var(--paper) 75%,#d9b865)";
    },
    hint: "Lampy świecą poziomo i pionowo do ściany. Oświetl wszystkie białe pola, ale żadna lampa nie może oświetlać innej. Liczba na ścianie oznacza lampy przy jej bokach.",
  });
  MoreGame.rays = rays;
})();
