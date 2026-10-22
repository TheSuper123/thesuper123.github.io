(() => {
  "use strict";
  const H = SpinnerThirty.create(["KOLEJKA", "PIONKI I", "PIONKI II"]);
  H.board.className = "th-morris";
  H.board.dataset.aspect = "1";
  let selected = -1;
  const mills = [];
  for (let r = 0; r < 3; r++)
    for (const line of [
      [0, 1, 2],
      [2, 3, 4],
      [4, 5, 6],
      [6, 7, 0],
    ])
      mills.push(line.map((i) => r * 8 + i));
  for (const p of [1, 3, 5, 7]) mills.push([p, p + 8, p + 16]);
  const inMill = (b, i) =>
    mills.some(
      (line) => line.includes(i) && line.every((j) => b[j] === b[i] && b[i]),
    );
  const adjacent = (i) => {
    const ring = Math.floor(i / 8),
      p = i % 8,
      out = [ring * 8 + ((p + 1) % 8), ring * 8 + ((p + 7) % 8)];
    if (p % 2) {
      if (ring) out.push(i - 8);
      if (ring < 2) out.push(i + 8);
    }
    return out;
  };
  function legal(s) {
    const own = s.board.flatMap((p, i) => (p === s.turn ? [i] : [])),
      empty = s.board.flatMap((p, i) => (p ? [] : [i]));
    if (s.remove) {
      const enemy = s.board.flatMap((p, i) => (p === 3 - s.turn ? [i] : [])),
        safe = enemy.filter((i) => !inMill(s.board, i));
      return (safe.length ? safe : enemy).map((i) => 1000 + i);
    }
    if (s.left[s.turn - 1]) return empty;
    return own.flatMap((from) =>
      empty
        .filter((to) => own.length === 3 || adjacent(from).includes(to))
        .map((to) => 64 + from * 24 + to),
    );
  }
  const rules = {
    depth: 2,
    initial() {
      selected = -1;
      return {
        board: Array(24).fill(0),
        left: [9, 9],
        turn: 1,
        remove: false,
        quiet: 0,
      };
    },
    legal,
    apply(s, code) {
      const board = [...s.board],
        left = [...s.left];
      if (s.remove) {
        board[code - 1000] = 0;
        return { board, left, turn: 3 - s.turn, remove: false, quiet: 0 };
      }
      let to = code;
      if (code < 24) left[s.turn - 1]--;
      else {
        const move = code - 64,
          from = Math.floor(move / 24);
        to = move % 24;
        board[from] = 0;
      }
      board[to] = s.turn;
      const remove = inMill(board, to) && board.includes(3 - s.turn);
      return {
        board,
        left,
        turn: remove ? s.turn : 3 - s.turn,
        remove,
        quiet: s.quiet + 1,
      };
    },
    scores: (s) => [
      s.board.filter((p) => p === 1).length + s.left[0],
      s.board.filter((p) => p === 2).length + s.left[1],
    ],
    result(s) {
      if (s.quiet >= 100) return 0;
      if (s.left.some(Boolean)) return null;
      if (s.board.filter((p) => p === s.turn).length < 3 || !legal(s).length)
        return 3 - s.turn;
      return null;
    },
    evaluate(s, p) {
      const score = rules.scores(s);
      return (
        (score[p - 1] - score[2 - p]) * 30 +
        mills.reduce(
          (sum, l) =>
            sum +
            (l.filter((i) => s.board[i] === p).length === 2 &&
            l.some((i) => !s.board[i])
              ? 6
              : 0) -
            (l.filter((i) => s.board[i] === 3 - p).length === 2 &&
            l.some((i) => !s.board[i])
              ? 6
              : 0),
          0,
        )
      );
    },
    draw(s, play) {
      const coords = Array.from({ length: 24 }, (_, i) => {
        const r = Math.floor(i / 8),
          p = i % 8,
          a = 30 + r * 50,
          b = 390 - r * 50,
          m = 210;
        return [
          [a, a],
          [m, a],
          [b, a],
          [b, m],
          [b, b],
          [m, b],
          [a, b],
          [a, m],
        ][p];
      });
      H.board.innerHTML = `<svg class="th-svg" viewBox="0 0 420 420">${[0, 1, 2].map((r) => `<rect x="${30 + r * 50}" y="${30 + r * 50}" width="${360 - r * 100}" height="${360 - r * 100}" fill="none" stroke="var(--edge)" stroke-width="3"/>`).join("")}<path d="M210 30v100M290 210h100M210 290v100M30 210h100" stroke="var(--edge)" stroke-width="3"/>${coords.map(([x, y], i) => `<circle data-index="${i}" tabindex="0" role="button" aria-label="Pole ${i + 1}: ${s.board[i] ? "gracz " + s.board[i] : "puste"}" cx="${x}" cy="${y}" r="14" fill="${s.board[i] === 1 ? "var(--orange)" : s.board[i] === 2 ? "var(--game-blue)" : "var(--paper)"}" stroke="${i === selected ? "var(--orange)" : "var(--ink)"}" stroke-width="${i === selected ? 5 : 2}"/>`).join("")}</svg>`;
      const choose = (i) => {
        if (s.remove) {
          play(1000 + i);
          selected = -1;
        } else if (s.left[s.turn - 1]) play(i);
        else if (s.board[i] === s.turn) {
          selected = i;
          H.render();
        } else if (selected >= 0) {
          const m = 64 + selected * 24 + i;
          selected = -1;
          play(m);
        }
      };
      H.board.querySelectorAll("[data-index]").forEach((b) => {
        b.onclick = () => choose(Number(b.dataset.index));
        b.onkeydown = (e) => {
          if ([" ", "Enter"].includes(e.key)) {
            e.preventDefault();
            choose(Number(b.dataset.index));
          }
        };
      });
      if (s.remove) H.say("Młynek! Zdejmij pionek rywala spoza młynka.");
    },
  };
  const api = SpinnerTurn.create(H, rules);
  api.mills = mills;
  api.adjacent = adjacent;
})();
