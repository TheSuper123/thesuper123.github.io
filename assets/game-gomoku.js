(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 13;
  function winner(s) {
    for (let i = 0; i < n * n; i++)
      if (s.board[i])
        for (const [dy, dx] of [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, -1],
        ]) {
          const r = Math.floor(i / n),
            c = i % n;
          if (r + dy * 4 >= n || c + dx * 4 < 0 || c + dx * 4 >= n) continue;
          if (
            Array.from(
              { length: 5 },
              (_, k) => s.board[(r + dy * k) * n + c + dx * k],
            ).every((v) => v === s.board[i])
          )
            return s.board[i];
        }
    return s.board.every(Boolean) ? 0 : null;
  }
  function worth(b, i, p) {
    let score = 0;
    const r = Math.floor(i / n),
      c = i % n;
    for (const [dy, dx] of [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]) {
      let count = 1,
        open = 0;
      for (const sign of [-1, 1]) {
        let k = 1;
        while (k < 5) {
          const y = r + dy * k * sign,
            x = c + dx * k * sign;
          if (y < 0 || y >= n || x < 0 || x >= n) break;
          const v = b[y * n + x];
          if (v === p) {
            count++;
            k++;
          } else {
            if (!v) open++;
            break;
          }
        }
      }
      score +=
        count >= 5 ? 1e6 : open ? Math.pow(9, count) * (open === 2 ? 2 : 1) : 0;
    }
    return score;
  }
  const rules = {
    initial: () => ({ board: Array(n * n).fill(0), turn: 1, moves: 0 }),
    legal: (s) => s.board.flatMap((v, i) => (v ? [] : [i])),
    apply: (s, i) => {
      const t = S.clone(s);
      t.board[i] = s.turn;
      t.turn = 3 - s.turn;
      t.moves++;
      return t;
    },
    result: winner,
    scores: (s) => [
      s.board.filter((v) => v === 1).length,
      s.board.filter((v) => v === 2).length,
    ],
    choose(s) {
      const empty = rules.legal(s);
      if (empty.length === n * n) return Math.floor((n * n) / 2);
      return empty.sort(
        (a, b) =>
          worth(s.board, b, s.turn) +
          worth(s.board, b, 3 - s.turn) * 0.92 -
          (worth(s.board, a, s.turn) + worth(s.board, a, 3 - s.turn) * 0.92),
      )[0];
    },
    draw(H, s, play) {
      H.grid(
        n,
        s.board.map((v) => (v ? "●" : "")),
        play,
        (b, i) => {
          b.dataset.player = s.board[i];
          b.classList.add("hu-board-text");
          b.setAttribute(
            "aria-label",
            `Pole ${i + 1}, ${s.board[i] ? "gracz " + s.board[i] : "puste"}`,
          );
        },
      );
    },
    hint: "Ułóż co najmniej pięć kamieni w linii. Swobodna odmiana: dłuższy rząd także wygrywa.",
  };
  S.duel(rules);
})();
