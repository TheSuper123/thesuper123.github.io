(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6,
    colors = ["#bc4c2c", "#48765b", "#737ec2", "#b0802d", "#8d5a82", "#368c9b"];
  let color = 1;
  function initial() {
    let paths = [];
    for (let pair = 0; pair < 3; pair++) {
      const r = pair * 2;
      let local =
        Math.random() < 0.7
          ? [
              [4, 3, 2, 1, 0, 6],
              [5, 11, 10, 9, 8, 7],
            ]
          : [
              [0, 1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10, 11],
            ];
      if (Math.random() < 0.5)
        local = local.map((p) =>
          p.map((i) => Math.floor(i / 6) * 6 + 5 - (i % 6)),
        );
      paths.push(...local.map((p) => p.map((i) => r * 6 + i)));
    }
    const rotate = Math.random() < 0.5,
      flip = Math.random() < 0.5;
    paths = paths.map((p) =>
      p.map((i) => {
        let r = Math.floor(i / 6),
          c = i % 6;
        if (rotate) [r, c] = [c, r];
        if (flip) r = 5 - r;
        return r * 6 + c;
      }),
    );
    paths = S.shuffle(paths);
    const ends = Array(36).fill(0),
      solution = Array(36).fill(0);
    paths.forEach((p, k) => {
      ends[p[0]] = ends[p.at(-1)] = k + 1;
      p.forEach((i) => (solution[i] = k + 1));
    });
    return {
      board: [...ends],
      ends,
      fixed: ends.map(Boolean),
      solution,
      moves: 0,
    };
  }
  function valid(s) {
    if (s.board.includes(0)) return false;
    for (let k = 1; k <= 6; k++) {
      const cells = s.board.flatMap((v, i) => (v === k ? [i] : [])),
        ends = s.ends.flatMap((v, i) => (v === k ? [i] : []));
      if (!S.connected(cells, n)) return false;
      for (const i of cells)
        if (
          S.neighbors(i, n).filter((j) => s.board[j] === k).length !==
          (ends.includes(i) ? 1 : 2)
        )
          return false;
    }
    return true;
  }
  S.puzzle({
    n,
    initial,
    valid,
    goal: "6 ŚCIEŻEK",
    tools: Array.from({ length: 6 }, (_, i) => [i + 1, String(i + 1)]).concat([
      [0, "×"],
    ]),
    action(s, i, v) {
      s.board[i] = v;
    },
    text: (s, i) => s.ends[i] || (s.board[i] && "·") || "",
    decorate(b, i, s) {
      if (s.board[i]) {
        b.style.background = colors[s.board[i] - 1];
        b.style.color = "#fff";
      }
      b.setAttribute(
        "aria-label",
        `Pole ${i + 1}, ${s.ends[i] ? "koniec " : "ścieżka "}${s.board[i] || "puste"}`,
      );
    },
    hint: "Połącz każdą parę tych samych cyfr własną ścieżką i zajmij wszystkie pola. Ścieżki idą po bokach pól, nie przecinają się, nie rozgałęziają i nie dotykają same siebie bokiem.",
  });
})();
