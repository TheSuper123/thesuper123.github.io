(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6;
  let selected = -1;
  function legal(s) {
    if (s.stage === 0)
      return [14, 15, 20, 21].filter((i) => s.board[i] === 1).map((i) => [i]);
    if (s.stage === 1)
      return S.neighbors(s.hole, n)
        .filter((i) => s.board[i] === 2)
        .map((i) => [i]);
    const out = [];
    for (let i = 0; i < 36; i++)
      if (s.board[i] === s.turn)
        for (const [dy, dx] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ]) {
          let y = Math.floor(i / n),
            x = i % n,
            path = [i];
          while (true) {
            const yy = y + dy * 2,
              xx = x + dx * 2;
            if (
              yy < 0 ||
              yy >= n ||
              xx < 0 ||
              xx >= n ||
              s.board[(y + dy) * n + x + dx] !== 3 - s.turn ||
              s.board[yy * n + xx]
            )
              break;
            path = [...path, yy * n + xx];
            out.push(path);
            y = yy;
            x = xx;
          }
        }
    return out;
  }
  S.duel({
    initial() {
      selected = -1;
      return {
        board: Array.from(
          { length: 36 },
          (_, i) => ((Math.floor(i / n) + (i % n)) % 2) + 1,
        ),
        turn: 1,
        stage: 0,
        hole: -1,
        moves: 0,
      };
    },
    legal,
    apply(s, m) {
      const t = S.clone(s);
      if (s.stage < 2) {
        t.board[m[0]] = 0;
        t.hole = m[0];
        t.stage++;
      } else {
        t.board[m[0]] = 0;
        for (let k = 1; k < m.length; k++) t.board[(m[k - 1] + m[k]) / 2] = 0;
        t.board[m.at(-1)] = s.turn;
      }
      t.turn = 3 - s.turn;
      t.moves++;
      return t;
    },
    result: (s) => (s.stage === 2 && !legal(s).length ? 3 - s.turn : null),
    scores: (s) => [
      s.board.filter((v) => v === 1).length,
      s.board.filter((v) => v === 2).length,
    ],
    evaluate: (s, p) =>
      legal({ ...s, turn: p }).length - legal({ ...s, turn: 3 - p }).length,
    resetSelection: () => (selected = -1),
    draw(H, s, play) {
      const moves = legal(s);
      H.grid(
        6,
        s.board.map((v) => (v ? "●" : "")),
        (i) => {
          if (s.stage < 2) {
            const m = moves.find((m) => m[0] === i);
            if (m) play(m);
          } else if (s.board[i] === s.turn) {
            selected = i;
            H.render();
          } else {
            const m = moves.find((m) => m[0] === selected && m.at(-1) === i);
            if (m) {
              selected = -1;
              play(m);
            }
          }
        },
        (b, i) => {
          b.dataset.selected = String(i === selected);
          b.dataset.legal = String(
            moves.some((m) =>
              s.stage < 2 ? m[0] === i : m[0] === selected && m.at(-1) === i,
            ),
          );
          if (s.board[i])
            b.innerHTML = `<span class="hu-piece" data-player="${s.board[i]}"></span>`;
        },
      );
    },
    hint: "Usuń wskazany środkowy pionek, rywal usuwa sąsiedni. Potem przeskakuj pionki rywala w linii prostej. Możesz zakończyć po dowolnym skoku. Brak skoku oznacza przegraną.",
  });
})();
