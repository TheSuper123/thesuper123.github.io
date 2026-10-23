(() => {
  "use strict";
  const S = SpinnerHundred;
  let pending = -1;
  function win(b) {
    const winners = new Set();
    for (let i = 0; i < 36; i++)
      if (b[i])
        for (const [dy, dx] of [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, -1],
        ]) {
          const r = Math.floor(i / 6),
            c = i % 6;
          if (r + dy * 4 >= 6 || c + dx * 4 < 0 || c + dx * 4 >= 6) continue;
          if (
            Array.from(
              { length: 5 },
              (_, k) => b[(r + dy * k) * 6 + c + dx * k],
            ).every((v) => v === b[i])
          )
            winners.add(b[i]);
        }
    return winners.size === 2 ? 0 : winners.size ? [...winners][0] : null;
  }
  function apply(s, m) {
    const t = S.clone(s);
    t.board[m[0]] = s.turn;
    const q = m[1],
      dir = m[2],
      y = Math.floor(q / 2) * 3,
      x = (q % 2) * 3,
      old = [...t.board];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        const rr = dir === 1 ? c : 2 - c,
          cc = dir === 1 ? 2 - r : r;
        t.board[(y + rr) * 6 + x + cc] = old[(y + r) * 6 + x + c];
      }
    t.turn = 3 - s.turn;
    t.moves++;
    return t;
  }
  const legal = (s) =>
    s.board.flatMap((v, i) =>
      v
        ? []
        : Array.from({ length: 8 }, (_, k) => [
            i,
            Math.floor(k / 2),
            k % 2 ? 1 : -1,
          ]),
    );
  S.duel({
    initial() {
      pending = -1;
      return { board: Array(36).fill(0), turn: 1, moves: 0 };
    },
    legal,
    apply,
    result: (s) => win(s.board) ?? (s.board.every(Boolean) ? 0 : null),
    scores: (s) => [
      s.board.filter((v) => v === 1).length,
      s.board.filter((v) => v === 2).length,
    ],
    choose(s) {
      let best = -Infinity,
        pick = null;
      for (const m of S.shuffle(legal(s))) {
        const t = apply(s, m),
          w = win(t.board);
        let value = w === s.turn ? 1e8 : w === 3 - s.turn ? -1e8 : 0;
        for (let i = 0; i < 36; i++)
          if (t.board[i] === s.turn)
            value += S.neighbors(i, 6, true).filter(
              (j) => t.board[j] === s.turn,
            ).length;
        if (value > best) {
          best = value;
          pick = m;
        }
      }
      return pick;
    },
    setup(H, get, play) {
      for (let q = 0; q < 4; q++)
        for (const d of [-1, 1])
          H.button(
            `${q + 1} ${d === 1 ? "↻" : "↺"}`,
            () => {
              if (pending >= 0) {
                const m = [pending, q, d];
                pending = -1;
                play(m);
              }
            },
            H.extra,
          );
    },
    resetSelection: () => (pending = -1),
    draw(H, s) {
      H.grid(
        6,
        s.board.map((v, i) => (v ? "●" : i === pending ? "○" : "")),
        (i) => {
          if (!s.board[i] && H.active()) {
            pending = i;
            H.say("Teraz obróć jedną z czterech ćwiartek.");
            H.render();
          }
        },
        (b, i) => {
          b.dataset.selected = String(i === pending);
          b.style.borderRightWidth = i % 6 === 2 ? "4px" : "1px";
          b.style.borderBottomWidth = Math.floor(i / 6) === 2 ? "4px" : "1px";
          if (s.board[i])
            b.innerHTML = `<span class="hu-piece" data-player="${s.board[i]}"></span>`;
        },
      );
    },
    hint: "Postaw kamień, potem obróć dowolną ćwiartkę o 90°. Liczy się pięć w rzędzie po obrocie. Równoczesna linia obu graczy oznacza remis.",
  });
})();
