(() => {
  "use strict";
  const S = SpinnerHundred,
    N = 9;
  function group(b, i) {
    const who = b[i],
      cells = new Set(),
      lib = new Set(),
      todo = [i];
    while (todo.length) {
      const j = todo.pop();
      if (cells.has(j)) continue;
      cells.add(j);
      for (const k of S.neighbors(j, N))
        if (!b[k]) lib.add(k);
        else if (b[k] === who && !cells.has(k)) todo.push(k);
    }
    return { cells: [...cells], lib: [...lib] };
  }
  function apply(s, i) {
    const t = S.clone(s);
    t.turn = 3 - s.turn;
    t.moves++;
    t.previous = s.board.join(",");
    if (i === -1) {
      t.passes++;
      return t;
    }
    if (i < 0 || i >= 81 || s.board[i]) return null;
    t.board[i] = s.turn;
    t.passes = 0;
    let captured = 0;
    for (const j of S.neighbors(i, N))
      if (t.board[j] === 3 - s.turn) {
        const g = group(t.board, j);
        if (!g.lib.length)
          for (const k of g.cells) {
            t.board[k] = 0;
            captured++;
          }
      }
    if (!group(t.board, i).lib.length || t.board.join(",") === s.previous)
      return null;
    t.captures[s.turn - 1] += captured;
    return t;
  }
  function area(s) {
    const scores = [
        s.board.filter((x) => x === 1).length,
        s.board.filter((x) => x === 2).length + 6.5,
      ],
      seen = new Set();
    for (let i = 0; i < 81; i++)
      if (!s.board[i] && !seen.has(i)) {
        const region = [],
          border = new Set(),
          todo = [i];
        while (todo.length) {
          const j = todo.pop();
          if (seen.has(j)) continue;
          seen.add(j);
          region.push(j);
          for (const k of S.neighbors(j, N))
            if (s.board[k]) border.add(s.board[k]);
            else if (!seen.has(k)) todo.push(k);
        }
        if (border.size === 1) scores[[...border][0] - 1] += region.length;
      }
    return scores;
  }
  const legal = (s) =>
    [...Array(81).keys()].filter((i) => apply(s, i)).concat(-1);
  S.duel({
    initial: () => ({
      board: Array(81).fill(0),
      turn: 1,
      previous: "",
      passes: 0,
      captures: [0, 0],
      moves: 0,
    }),
    legal,
    apply,
    result: (s) => (s.passes >= 2 ? (area(s)[0] > area(s)[1] ? 1 : 2) : null),
    scores: area,
    evaluate: (s, p) => {
      const a = area(s);
      return a[p - 1] - a[2 - p];
    },
    choose(s) {
      const options = legal(s).filter((i) => i >= 0);
      if (!options.length || (s.passes && s.board.filter(Boolean).length > 50))
        return -1;
      let best = -Infinity,
        pick = options[0];
      for (const i of S.shuffle(options)) {
        const t = apply(s, i),
          score =
            (t.captures[s.turn - 1] - s.captures[s.turn - 1]) * 20 +
            group(t.board, i).lib.length -
            S.neighbors(i, N).filter((j) => s.board[j] === s.turn).length *
              1.6 +
            Math.random() * 0.5;
        if (score > best) {
          best = score;
          pick = i;
        }
      }
      return pick;
    },
    setup(H, get, play) {
      H.button("Pas", () => play(-1));
    },
    draw(H, s, play) {
      H.grid(
        9,
        s.board.map((v) => (v ? "●" : "")),
        play,
        (b, i) => {
          if (s.board[i])
            b.innerHTML = `<span class="hu-piece" data-player="${s.board[i]}"></span>`;
          b.setAttribute(
            "aria-label",
            `Pole ${i + 1}, ${s.board[i] ? "kamień gracza " + s.board[i] : "wolne"}`,
          );
        },
      );
    },
    hint: "Plansza 9 × 9. Dwa pasy kończą partię. Punktacja obszarowa, komi 6,5 dla białych. Grupy sporne dograjcie przed pasem.",
  });
  MoreGame.group = group;
  MoreGame.area = area;
})();
