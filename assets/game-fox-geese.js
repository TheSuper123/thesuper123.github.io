(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 7;
  let selected = -1;
  const allowed = (i) => {
    const r = Math.floor(i / 7),
      c = i % 7;
    return (r >= 2 && r <= 4) || (c >= 2 && c <= 4);
  };
  function legal(s) {
    const out = [];
    for (let i = 0; i < 49; i++)
      if (s.board[i] === s.turn)
        for (const [dy, dx] of s.turn === 1
          ? [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ]
          : [
              [1, 0],
              [0, -1],
              [0, 1],
            ]) {
          const r = Math.floor(i / n),
            c = i % n,
            y = r + dy,
            x = c + dx;
          if (y < 0 || y >= n || x < 0 || x >= n || !allowed(y * n + x))
            continue;
          const j = y * n + x;
          if (!s.board[j]) out.push([i, j]);
          else if (s.turn === 1 && s.board[j] === 2) {
            const yy = y + dy,
              xx = x + dx,
              k = yy * n + xx;
            if (
              yy >= 0 &&
              yy < n &&
              xx >= 0 &&
              xx < n &&
              allowed(k) &&
              !s.board[k]
            )
              out.push([i, k]);
          }
        }
    return out;
  }
  const scores = (s) => [s.caught, s.board.filter((v) => v === 2).length];
  S.duel({
    initial() {
      selected = -1;
      const board = Array(49).fill(0);
      for (let i = 0; i < 21; i++) if (allowed(i)) board[i] = 2;
      board[38] = 1;
      return { board, turn: 1, caught: 0, quiet: 0, moves: 0 };
    },
    legal,
    apply(s, [a, b]) {
      const t = S.clone(s);
      t.board[a] = 0;
      t.board[b] = s.turn;
      const jump =
        Math.abs(Math.floor(a / n) - Math.floor(b / n)) +
          Math.abs((a % n) - (b % n)) ===
        2;
      if (jump && s.turn === 1) {
        t.board[(a + b) / 2] = 0;
        t.caught++;
      }
      t.turn = 3 - s.turn;
      t.moves++;
      t.quiet = jump ? 0 : s.quiet + 1;
      return t;
    },
    result: (s) =>
      s.board.filter((v) => v === 2).length < 4
        ? 1
        : !legal(s).length
          ? 3 - s.turn
          : s.quiet >= 100
            ? 0
            : null,
    scores,
    evaluate: (s, p) => {
      const mobility = legal({ ...s, turn: 1 }).length,
        score = s.caught * 12 + mobility * 3;
      return p === 1 ? score : -score;
    },
    resetSelection: () => (selected = -1),
    draw(H, s, play) {
      const moves = legal(s);
      H.grid(
        n,
        s.board.map((v) => (v === 1 ? "L" : v === 2 ? "G" : "")),
        (i) => {
          if (s.board[i] === s.turn) {
            selected = i;
            H.render();
          } else if (moves.some((m) => m[0] === selected && m[1] === i)) {
            const m = [selected, i];
            selected = -1;
            play(m);
          }
        },
        (b, i) => {
          b.disabled = !allowed(i);
          if (!allowed(i)) b.style.visibility = "hidden";
          b.dataset.selected = String(i === selected);
          b.dataset.legal = String(
            moves.some((m) => m[0] === selected && m[1] === i),
          );
          b.setAttribute(
            "aria-label",
            `${s.board[i] === 1 ? "Lis" : s.board[i] === 2 ? "Gęś" : "Pole"} ${i + 1}`,
          );
        },
      );
    },
    hint: "Lis (I) chodzi i przeskakuje gęsi po liniach poziomych i pionowych. Gęsi (II) idą w dół lub na boki. Zablokuj lisa albo jako lis zostaw mniej niż cztery gęsi. Jeden skok na turę.",
  });
})();
