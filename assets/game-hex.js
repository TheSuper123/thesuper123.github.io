(() => {
  "use strict";
  const H = SpinnerThirty.create(["KOLEJKA", "POLA I", "POLA II"]),
    n = 7;
  H.board.className = "th-hex-board";
  H.board.dataset.aspect = "1.47";
  const adjacent = (i) => {
    const r = Math.floor(i / n),
      c = i % n;
    return [
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
    ]
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([y, x]) => y >= 0 && y < n && x >= 0 && x < n)
      .map(([y, x]) => y * n + x);
  };
  function distance(board, p) {
    const d = Array(49).fill(999),
      done = new Set();
    for (let i = 0; i < 49; i++)
      if ((p === 1 ? i % n === 0 : i < n) && board[i] !== 3 - p)
        d[i] = board[i] === p ? 0 : 1;
    for (let k = 0; k < 49; k++) {
      let i = -1;
      for (let j = 0; j < 49; j++)
        if (!done.has(j) && (i < 0 || d[j] < d[i])) i = j;
      if (i < 0 || d[i] === 999) break;
      done.add(i);
      if (p === 1 ? i % n === 6 : i >= 42) return d[i];
      for (const j of adjacent(i))
        if (board[j] !== 3 - p)
          d[j] = Math.min(d[j], d[i] + (board[j] === p ? 0 : 1));
    }
    return 999;
  }
  const rules = {
    depth: 2,
    initial: () => ({ board: Array(49).fill(0), turn: 1 }),
    legal: (s) =>
      s.board
        .flatMap((v, i) => (v ? [] : [i]))
        .sort((a, b) => Math.abs(a - 24) - Math.abs(b - 24)),
    apply(s, i) {
      const board = [...s.board];
      board[i] = s.turn;
      return { board, turn: 3 - s.turn };
    },
    scores: (s) => [
      s.board.filter((v) => v === 1).length,
      s.board.filter((v) => v === 2).length,
    ],
    result(s) {
      for (const p of [1, 2]) if (distance(s.board, p) === 0) return p;
      return null;
    },
    evaluate: (s, p) => (distance(s.board, 3 - p) - distance(s.board, p)) * 50,
    draw(s, play) {
      H.board.innerHTML = `<svg class="th-svg" viewBox="0 0 500 340" role="group" aria-label="Plansza Hex">${s.board
        .map((p, i) => {
          const r = Math.floor(i / 7),
            c = i % 7,
            x = 52 + c * 45 + r * 22,
            y = 44 + r * 40,
            points = Array.from(
              { length: 6 },
              (_, k) =>
                `${x + 25 * Math.cos(((k * 60 - 30) * Math.PI) / 180)},${y + 25 * Math.sin(((k * 60 - 30) * Math.PI) / 180)}`,
            ).join(" ");
          return `<polygon data-index="${i}" tabindex="0" role="button" aria-label="Pole ${r + 1}, ${c + 1}: ${p ? "gracz " + p : "puste"}" points="${points}" fill="${p === 1 ? "var(--orange)" : p === 2 ? "var(--game-blue)" : "var(--paper)"}" stroke="var(--edge)" stroke-width="2"/>`;
        })
        .join(
          "",
        )}<text x="40" y="330" font-size="12">I: LEWO ↔ PRAWO · II: GÓRA ↔ DÓŁ</text></svg>`;
      H.board.querySelectorAll("[data-index]").forEach((b) => {
        b.onclick = () => play(Number(b.dataset.index));
        b.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            play(Number(b.dataset.index));
          }
        };
      });
    },
  };
  const api = SpinnerTurn.create(H, rules);
  api.distance = distance;
  api.adjacent = adjacent;
})();
