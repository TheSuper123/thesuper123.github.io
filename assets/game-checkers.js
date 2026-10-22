(() => {
  "use strict";
  const H = SpinnerThirty.create(["KOLEJKA", "PIONKI I", "PIONKI II"]);
  let selected = -1;
  const owner = (v) => (v > 0 ? 1 : v < 0 ? 2 : 0);
  function options(s, capturesOnly = false) {
    const jumps = [],
      steps = [];
    for (let from = 0; from < 64; from++) {
      if (
        owner(s.board[from]) !== s.turn ||
        (s.forced >= 0 && s.forced !== from)
      )
        continue;
      const r = Math.floor(from / 8),
        c = from % 8;
      for (const dr of Math.abs(s.board[from]) === 2
        ? [-1, 1]
        : [s.turn === 1 ? -1 : 1])
        for (const dc of [-1, 1]) {
          const y = r + dr,
            x = c + dc;
          if (y < 0 || y >= 8 || x < 0 || x >= 8) continue;
          const near = y * 8 + x;
          if (!s.board[near]) steps.push(from * 64 + near);
          else if (owner(s.board[near]) === 3 - s.turn) {
            const yy = y + dr,
              xx = x + dc;
            if (yy >= 0 && yy < 8 && xx >= 0 && xx < 8 && !s.board[yy * 8 + xx])
              jumps.push(from * 64 + yy * 8 + xx);
          }
        }
    }
    return jumps.length || capturesOnly ? jumps : steps;
  }
  const rules = {
    depth: 3,
    initial() {
      selected = -1;
      const board = Array(64).fill(0);
      for (let i = 0; i < 64; i++)
        if ((Math.floor(i / 8) + (i % 8)) % 2)
          board[i] = i < 24 ? -1 : i >= 40 ? 1 : 0;
      return { board, turn: 1, forced: -1, quiet: 0 };
    },
    legal: options,
    apply(s, code) {
      const board = [...s.board],
        from = Math.floor(code / 64),
        to = code % 64,
        r = Math.floor(from / 8),
        y = Math.floor(to / 8);
      board[to] = board[from];
      board[from] = 0;
      const capture = Math.abs(r - y) === 2;
      if (capture) board[((r + y) / 2) * 8 + ((from % 8) + (to % 8)) / 2] = 0;
      const promoted = Math.abs(board[to]) === 1 && (y === 0 || y === 7);
      if (promoted) board[to] *= 2;
      const next = {
        board,
        turn: s.turn,
        forced: to,
        quiet: capture || promoted ? 0 : s.quiet + 1,
      };
      if (capture && !promoted && options(next, true).length) return next;
      next.turn = 3 - s.turn;
      next.forced = -1;
      return next;
    },
    scores: (s) => [
      s.board.filter((v) => v > 0).length,
      s.board.filter((v) => v < 0).length,
    ],
    result(s) {
      if (s.quiet >= 80) return 0;
      return options(s).length ? null : 3 - s.turn;
    },
    evaluate(s, root) {
      return s.board.reduce(
        (sum, v, i) =>
          sum +
          (v
            ? (owner(v) === root ? 1 : -1) * (Math.abs(v) === 2 ? 24 : 12) +
              (v > 0
                ? (7 - Math.floor(i / 8)) * 0.25
                : v < 0
                  ? -Math.floor(i / 8) * 0.25
                  : 0) *
                (root === 1 ? 1 : -1)
            : 0),
        0,
      );
    },
    draw(s, play) {
      if (s.forced >= 0) selected = s.forced;
      const legal = options(s),
        dest = legal
          .filter((m) => Math.floor(m / 64) === selected)
          .map((m) => m % 64);
      H.grid(
        8,
        Array(64).fill(""),
        (i) => {
          if (owner(s.board[i]) === s.turn) {
            selected = i;
            H.render();
          } else if (selected >= 0 && legal.includes(selected * 64 + i)) {
            const move = selected * 64 + i;
            selected = -1;
            play(move);
          }
        },
        (b, i) => {
          b.classList.toggle(
            "th-dark",
            Boolean((Math.floor(i / 8) + (i % 8)) % 2),
          );
          b.dataset.selected = String(i === selected);
          b.dataset.legal = String(dest.includes(i));
          if (s.board[i])
            b.innerHTML = `<span class="th-piece" data-player="${owner(s.board[i])}">${Math.abs(s.board[i]) === 2 ? "♛" : ""}</span>`;
          b.setAttribute(
            "aria-label",
            `Pole ${i + 1}, ${s.board[i] ? "gracz " + owner(s.board[i]) + (Math.abs(s.board[i]) === 2 ? ", damka" : "") : "puste"}`,
          );
        },
      );
    },
  };
  SpinnerTurn.create(H, rules);
})();
