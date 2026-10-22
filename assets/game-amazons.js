(() => {
  "use strict";
  const H = SpinnerThirty.create(["KOLEJKA", "RUCHY I", "RUCHY II"]);
  let from = -1,
    to = -1;
  const dirs = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  function rays(b, i) {
    const out = [],
      r = Math.floor(i / 6),
      c = i % 6;
    for (const [dr, dc] of dirs)
      for (let k = 1; k < 6; k++) {
        const y = r + dr * k,
          x = c + dc * k;
        if (y < 0 || y >= 6 || x < 0 || x >= 6 || b[y * 6 + x]) break;
        out.push(y * 6 + x);
      }
    return out;
  }
  function legal(s) {
    const out = [];
    for (let a = 0; a < 36; a++)
      if (s.board[a] === s.turn)
        for (const b of rays(s.board, a)) {
          const board = [...s.board];
          board[a] = 0;
          board[b] = s.turn;
          for (const c of rays(board, b)) out.push(a * 1296 + b * 36 + c);
        }
    return out;
  }
  const rules = {
    depth: 2,
    initial() {
      from = to = -1;
      const board = Array(36).fill(0);
      board[1] = board[4] = 2;
      board[31] = board[34] = 1;
      return { board, turn: 1, moves: [0, 0] };
    },
    legal,
    apply(s, code) {
      const board = [...s.board],
        a = Math.floor(code / 1296),
        b = Math.floor((code % 1296) / 36),
        c = code % 36,
        moves = [...s.moves];
      board[a] = 0;
      board[b] = s.turn;
      board[c] = 3;
      moves[s.turn - 1]++;
      return { board, turn: 3 - s.turn, moves };
    },
    scores: (s) => s.moves,
    result: (s) =>
      s.board.some((p, i) => p === s.turn && rays(s.board, i).length)
        ? null
        : 3 - s.turn,
    evaluate(s, p) {
      return s.board.reduce(
        (sum, v, i) =>
          sum +
          (v === p
            ? rays(s.board, i).length
            : v === 3 - p
              ? -rays(s.board, i).length
              : 0),
        0,
      );
    },
    draw(s, play) {
      let possible = [];
      if (to >= 0) {
        const b = [...s.board];
        b[from] = 0;
        b[to] = s.turn;
        possible = rays(b, to);
      } else if (from >= 0) possible = rays(s.board, from);
      H.grid(
        6,
        s.board.map((p, i) => (p === 3 ? "×" : p === 1 || p === 2 ? "♛" : "")),
        (i) => {
          if (to >= 0) {
            const move = from * 1296 + to * 36 + i;
            if (legal(s).includes(move)) {
              from = to = -1;
              play(move);
            } else {
              from = to = -1;
              H.render();
            }
          } else if (s.board[i] === s.turn) {
            from = i;
            H.render();
          } else if (from >= 0 && possible.includes(i)) {
            to = i;
            H.say("Teraz wybierz cel strzały.");
            H.render();
          }
        },
        (b, i) => {
          b.dataset.owner = s.board[i] === 3 ? 0 : s.board[i];
          b.dataset.selected = String(i === from || i === to);
          b.dataset.legal = String(possible.includes(i));
          if (s.board[i] === 3) b.classList.add("th-dark");
          b.setAttribute(
            "aria-label",
            `Pole ${i + 1}: ${s.board[i] === 3 ? "strzała" : s.board[i] ? "amazonka gracza " + s.board[i] : "puste"}`,
          );
        },
      );
    },
  };
  const api = SpinnerTurn.create(H, rules);
  api.rays = rays;
})();
