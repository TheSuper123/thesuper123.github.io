(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6,
    dirs = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ],
    rotate = (v) => ((v << 1) & 15) | (v >> 3);
  function valid(s) {
    const seen = new Set(),
      todo = [0];
    while (todo.length) {
      const i = todo.pop();
      if (seen.has(i)) continue;
      seen.add(i);
      for (let d = 0; d < 4; d++)
        if (s.board[i] & (1 << d)) {
          const y = Math.floor(i / n) + dirs[d][0],
            x = (i % n) + dirs[d][1];
          if (y < 0 || y >= n || x < 0 || x >= n) return false;
          const j = y * n + x;
          if (!(s.board[j] & (1 << (d + 2) % 4))) return false;
          if (!seen.has(j)) todo.push(j);
        }
    }
    return seen.size === 36;
  }
  S.puzzle({
    n,
    goal: "36 POŁĄCZEŃ",
    initial() {
      const solution = Array(36).fill(0),
        seen = new Set([0]),
        todo = [0];
      while (todo.length) {
        const i = todo.at(-1),
          options = S.shuffle(S.neighbors(i, n)).filter((j) => !seen.has(j));
        if (!options.length) {
          todo.pop();
          continue;
        }
        const j = options[0],
          d = j === i - n ? 0 : j === i + 1 ? 1 : j === i + n ? 2 : 3;
        solution[i] |= 1 << d;
        solution[j] |= 1 << (d + 2) % 4;
        seen.add(j);
        todo.push(j);
      }
      return {
        solution,
        board: solution.map((v) => {
          for (let k = Math.floor(Math.random() * 4); k > 0; k--) v = rotate(v);
          return v;
        }),
        moves: 0,
      };
    },
    valid,
    action(s, i) {
      s.board[i] = rotate(s.board[i]);
    },
    render(H, s, act) {
      H.grid(
        n,
        s.board.map(() => ""),
        act,
        (b, i) => {
          b.innerHTML = `<svg viewBox="0 0 40 40" aria-hidden="true" stroke="currentColor" stroke-width="4" fill="none">${dirs.map((d, k) => (s.board[i] & (1 << k) ? `<path d="M20 20L${20 + d[1] * 20} ${20 + d[0] * 20}"/>` : "")).join("")}<circle cx="20" cy="20" r="${i === 0 ? 7 : 3}" fill="currentColor"/></svg>`;
          b.setAttribute(
            "aria-label",
            `Rura ${i + 1}, wyjścia ${dirs.flatMap((_, d) => (s.board[i] & (1 << d) ? [["góra", "prawo", "dół", "lewo"][d]] : [])).join(", ")}. Obróć.`,
          );
        },
      );
    },
    hint: "Obracaj rury o ćwierć obrotu. Połącz wszystkie pola ze źródłem w lewym górnym rogu. Każdy koniec rury musi trafić na drugi; nic nie może wychodzić poza planszę.",
  });
})();
