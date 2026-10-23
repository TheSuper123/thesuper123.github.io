(() => {
  "use strict";
  const S = SpinnerHundred;
  let selected = -1,
    promotion = 5;
  const side = (v) => (v > 0 ? 1 : v < 0 ? 2 : 0),
    sign = (p) => (p === 1 ? 1 : -1);
  const key = (s) =>
    s.board.join(",") + "/" + s.turn + "/" + s.castle.join("") + "/" + s.ep;
  function attacked(s, to, by) {
    const r = Math.floor(to / 8),
      c = to % 8;
    for (let i = 0; i < 64; i++) {
      const p = s.board[i];
      if (side(p) !== by) continue;
      const y = Math.floor(i / 8),
        x = i % 8,
        dy = r - y,
        dx = c - x,
        t = Math.abs(p);
      if (t === 1 && dy === (by === 1 ? -1 : 1) && Math.abs(dx) === 1)
        return true;
      if (t === 2 && Math.abs(dy) * Math.abs(dx) === 2) return true;
      if (t === 6 && Math.max(Math.abs(dy), Math.abs(dx)) === 1) return true;
      if (
        ((t === 3 && Math.abs(dy) === Math.abs(dx)) ||
          (t === 4 && (!dx || !dy)) ||
          (t === 5 && (!dx || !dy || Math.abs(dy) === Math.abs(dx)))) &&
        (dx || dy)
      ) {
        const sy = Math.sign(dy),
          sx = Math.sign(dx);
        let yy = y + sy,
          xx = x + sx,
          clear = true;
        while (yy !== r || xx !== c) {
          if (s.board[yy * 8 + xx]) {
            clear = false;
            break;
          }
          yy += sy;
          xx += sx;
        }
        if (clear) return true;
      }
    }
    return false;
  }
  const check = (s, p = s.turn) => {
    const i = s.board.indexOf(sign(p) * 6);
    return i < 0 || attacked(s, i, 3 - p);
  };
  function apply(s, m) {
    const next = S.clone(s),
      b = next.board,
      p = b[m.from],
      player = side(p),
      type = Math.abs(p),
      capture = b[m.to],
      dy = Math.floor(m.to / 8) - Math.floor(m.from / 8);
    b[m.from] = 0;
    b[m.to] = p;
    if (type === 1 && m.to === s.ep && !capture)
      b[m.to - (player === 1 ? -8 : 8)] = 0;
    if (type === 6 && Math.abs(m.to - m.from) === 2) {
      const from = m.to > m.from ? m.from + 3 : m.from - 4,
        to = m.to > m.from ? m.from + 1 : m.from - 1;
      b[to] = b[from];
      b[from] = 0;
    }
    if (type === 1 && (m.to < 8 || m.to >= 56))
      b[m.to] = sign(player) * (m.promotion || 5);
    if (type === 6) {
      next.castle[(player - 1) * 2] = false;
      next.castle[(player - 1) * 2 + 1] = false;
    }
    for (const [square, right] of [
      [63, 0],
      [56, 1],
      [7, 2],
      [0, 3],
    ])
      if (m.from === square || m.to === square) next.castle[right] = false;
    next.ep = type === 1 && Math.abs(dy) === 2 ? (m.from + m.to) / 2 : -1;
    next.turn = 3 - player;
    next.quiet = type === 1 || capture || m.to === s.ep ? 0 : s.quiet + 1;
    next.moves = s.moves + 1;
    next.positions = [...s.positions, key(next)];
    return next;
  }
  function legal(s) {
    const out = [],
      p = s.turn,
      sgn = sign(p);
    const add = (from, to) => {
      if (side(s.board[to]) === p || Math.abs(s.board[to]) === 6) return;
      for (const promotion of Math.abs(s.board[from]) === 1 &&
      (to < 8 || to >= 56)
        ? [5, 4, 3, 2]
        : [0]) {
        const m = { from, to, promotion };
        if (!check(apply(s, m), p)) out.push(m);
      }
    };
    for (let i = 0; i < 64; i++) {
      const t = Math.abs(s.board[i]);
      if (side(s.board[i]) !== p) continue;
      const r = Math.floor(i / 8),
        c = i % 8;
      if (t === 1) {
        const dr = p === 1 ? -1 : 1,
          y = r + dr;
        if (y >= 0 && y < 8) {
          if (!s.board[y * 8 + c]) {
            add(i, y * 8 + c);
            if (r === (p === 1 ? 6 : 1) && !s.board[(r + 2 * dr) * 8 + c])
              add(i, (r + 2 * dr) * 8 + c);
          }
          for (const dc of [-1, 1])
            if (c + dc >= 0 && c + dc < 8) {
              const j = y * 8 + c + dc;
              if (side(s.board[j]) === 3 - p || j === s.ep) add(i, j);
            }
        }
      } else if (t === 2 || t === 6) {
        for (const [dy, dx] of t === 2
          ? [
              [-2, -1],
              [-2, 1],
              [-1, -2],
              [-1, 2],
              [1, -2],
              [1, 2],
              [2, -1],
              [2, 1],
            ]
          : [
              [-1, -1],
              [-1, 0],
              [-1, 1],
              [0, -1],
              [0, 1],
              [1, -1],
              [1, 0],
              [1, 1],
            ]) {
          const y = r + dy,
            x = c + dx;
          if (y >= 0 && y < 8 && x >= 0 && x < 8) add(i, y * 8 + x);
        }
        if (t === 6 && i === (p === 1 ? 60 : 4) && !check(s, p))
          for (const [right, delta, rook] of [
            [(p - 1) * 2, 2, i + 3],
            [(p - 1) * 2 + 1, -2, i - 4],
          ]) {
            const step = Math.sign(delta),
              empty = delta > 0 ? [i + 1, i + 2] : [i - 1, i - 2, i - 3];
            if (
              s.castle[right] &&
              s.board[rook] === sgn * 4 &&
              empty.every((j) => !s.board[j]) &&
              !attacked(s, i + step, 3 - p) &&
              !attacked(s, i + delta, 3 - p)
            )
              add(i, i + delta);
          }
      } else
        for (const [dy, dx] of t === 3
          ? [
              [-1, -1],
              [-1, 1],
              [1, -1],
              [1, 1],
            ]
          : t === 4
            ? [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
              ]
            : [
                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1],
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
              ]) {
          let y = r + dy,
            x = c + dx;
          while (y >= 0 && y < 8 && x >= 0 && x < 8) {
            const j = y * 8 + x;
            add(i, j);
            if (s.board[j]) break;
            y += dy;
            x += dx;
          }
        }
    }
    return out;
  }
  function result(s) {
    if (!legal(s).length) return check(s) ? 3 - s.turn : 0;
    const remaining = s.board
      .map((v, i) => ({ v: Math.abs(v), i }))
      .filter((x) => x.v && x.v !== 6);
    if (
      s.quiet >= 100 ||
      s.positions.filter((k) => k === key(s)).length >= 3 ||
      !remaining.length ||
      (remaining.length === 1 && [2, 3].includes(remaining[0].v)) ||
      (remaining.every((x) => x.v === 3) &&
        new Set(remaining.map((x) => (Math.floor(x.i / 8) + (x.i % 8)) % 2))
          .size === 1)
    )
      return 0;
    return null;
  }
  const values = [0, 100, 320, 335, 500, 900, 20000],
    glyph = ["", "♟︎", "♞", "♝", "♜", "♛", "♚"];
  const evaluate = (s, p) =>
    s.board.reduce(
      (a, v, i) =>
        a +
        (v
          ? (side(v) === p ? 1 : -1) *
            (values[Math.abs(v)] +
              (Math.abs(v) === 1
                ? (side(v) === 1
                    ? 6 - Math.floor(i / 8)
                    : Math.floor(i / 8) - 1) * 4
                : 0))
          : 0),
      0,
    );
  S.duel({
    initial() {
      selected = -1;
      const back = [4, 2, 3, 5, 6, 3, 2, 4],
        s = {
          board: [
            ...back.map((v) => -v),
            ...Array(8).fill(-1),
            ...Array(32).fill(0),
            ...Array(8).fill(1),
            ...back,
          ],
          turn: 1,
          castle: [true, true, true, true],
          ep: -1,
          quiet: 0,
          moves: 0,
          positions: [],
        };
      s.positions = [key(s)];
      return s;
    },
    legal,
    apply,
    result,
    evaluate,
    resetSelection: () => (selected = -1),
    scores: (s) => [
      s.board.filter((v) => v > 0).length,
      s.board.filter((v) => v < 0).length,
    ],
    choose(s) {
      let best = -Infinity,
        pick = null;
      for (const m of S.shuffle(legal(s))) {
        const t = apply(s, m),
          replies = legal(t);
        let score;
        if (!replies.length) score = check(t) ? 1e7 : 0;
        else
          score = Math.min(
            ...replies.map((r) => evaluate(apply(t, r), s.turn)),
          );
        if (score > best) {
          best = score;
          pick = m;
        }
      }
      return pick;
    },
    setup(H) {
      H.select(
        "AWANS PIONA",
        [
          [5, "Hetman"],
          [4, "Wieża"],
          [3, "Goniec"],
          [2, "Skoczek"],
        ],
        (v) => (promotion = Number(v)),
      );
    },
    draw(H, s, play) {
      const moves = legal(s);
      H.grid(
        8,
        s.board.map((v) => (v ? glyph[Math.abs(v)] : "")),
        (i) => {
          if (side(s.board[i]) === s.turn) {
            selected = i;
            H.render();
          } else {
            const m = moves.find(
              (m) =>
                m.from === selected &&
                m.to === i &&
                (!m.promotion || m.promotion === promotion),
            );
            if (m) {
              selected = -1;
              play(m);
            }
          }
        },
        (b, i) => {
          b.classList.toggle("th-dark", !!((Math.floor(i / 8) + (i % 8)) % 2));
          b.dataset.selected = String(selected === i);
          b.dataset.legal = String(
            moves.some((m) => m.from === selected && m.to === i),
          );
          if (s.board[i])
            b.innerHTML = `<span class="hu-piece" data-player="${side(s.board[i])}">${glyph[Math.abs(s.board[i])]}</span>`;
          b.setAttribute(
            "aria-label",
            `${"abcdefgh"[i % 8]}${8 - Math.floor(i / 8)}, ${s.board[i] ? (side(s.board[i]) === 1 ? "białe " : "czarne ") + ["", "pion", "skoczek", "goniec", "wieża", "hetman", "król"][Math.abs(s.board[i])] : "puste"}`,
          );
        },
      );
      if (check(s) && H.active()) H.say("Szach. Chroń króla.");
    },
    hint: "Białe zaczynają. Roszada, bicie w przelocie i wybór awansu są dostępne.",
  });
})();
