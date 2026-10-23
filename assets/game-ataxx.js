(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 7;
  let selected = -1;
  function legal(s, p = s.turn) {
    const out = [];
    for (let i = 0; i < 49; i++)
      if (s.board[i] === p)
        for (let j = 0; j < 49; j++)
          if (!s.board[j]) {
            const d = Math.max(
              Math.abs(Math.floor(i / n) - Math.floor(j / n)),
              Math.abs((i % n) - (j % n)),
            );
            if (d === 1 || d === 2) out.push([i, j]);
          }
    return out;
  }
  const scores = (s) => [
    s.board.filter((v) => v === 1).length,
    s.board.filter((v) => v === 2).length,
  ];
  S.duel({
    initial() {
      selected = -1;
      const board = Array(49).fill(0);
      board[0] = board[48] = 1;
      board[6] = board[42] = 2;
      return { board, turn: 1, quiet: 0, moves: 0 };
    },
    legal,
    apply(s, [a, b]) {
      const t = S.clone(s),
        d = Math.max(
          Math.abs(Math.floor(a / n) - Math.floor(b / n)),
          Math.abs((a % n) - (b % n)),
        );
      if (d === 2) t.board[a] = 0;
      t.board[b] = s.turn;
      for (const i of S.neighbors(b, n, true))
        if (t.board[i]) t.board[i] = s.turn;
      t.turn = 3 - s.turn;
      t.moves++;
      t.quiet = d === 1 ? 0 : s.quiet + 1;
      if (!legal(t).length) t.turn = s.turn;
      return t;
    },
    result(s) {
      const [a, b] = scores(s);
      return !a
        ? 2
        : !b
          ? 1
          : !s.board.includes(0) ||
              (!legal(s, 1).length && !legal(s, 2).length) ||
              s.quiet >= 100
            ? a === b
              ? 0
              : a > b
                ? 1
                : 2
            : null;
    },
    scores,
    evaluate: (s, p) => {
      const a = scores(s);
      return a[p - 1] - a[2 - p];
    },
    resetSelection: () => (selected = -1),
    draw(H, s, play) {
      const moves = legal(s);
      H.grid(
        n,
        s.board.map((v) => (v ? "●" : "")),
        (i) => {
          if (s.board[i] === s.turn) {
            selected = i;
            H.render();
          } else if (moves.some(([a, b]) => a === selected && b === i)) {
            const m = [selected, i];
            selected = -1;
            play(m);
          }
        },
        (b, i) => {
          b.dataset.selected = String(i === selected);
          b.dataset.legal = String(
            moves.some(([a, j]) => a === selected && j === i),
          );
          if (s.board[i])
            b.innerHTML = `<span class="hu-piece" data-player="${s.board[i]}"></span>`;
        },
      );
    },
    hint: "Krok o jedno pole tworzy kopię, skok o dwa przenosi pionek. Sąsiednie pionki rywala zmieniają kolor. Bez ruchu oddajesz turę. 100 kolejnych skoków kończy partię liczeniem pionków.",
  });
})();
