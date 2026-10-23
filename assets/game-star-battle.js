(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6;
  function initial() {
    let cols;
    do {
      cols = S.shuffle([0, 1, 2, 3, 4, 5]);
    } while (cols.some((v, i) => i && Math.abs(v - cols[i - 1]) <= 1));
    const solution = Array(36).fill(0),
      regions = Array(36).fill(-1),
      front = [];
    cols.forEach((c, r) => {
      const i = r * n + c;
      solution[i] = 1;
      regions[i] = r;
      front.push(i);
    });
    while (regions.includes(-1)) {
      const edges = S.shuffle(
        front.flatMap((i) =>
          S.neighbors(i, n)
            .filter((j) => regions[j] < 0)
            .map((j) => [i, j]),
        ),
      );
      if (!edges.length) break;
      const [a, b] = edges[0];
      regions[b] = regions[a];
      front.push(b);
    }
    return { board: Array(36).fill(0), solution, regions, moves: 0 };
  }
  function valid(s) {
    for (let k = 0; k < n; k++) {
      if (
        s.board.filter((v, i) => v === 1 && Math.floor(i / n) === k).length !==
          1 ||
        s.board.filter((v, i) => v === 1 && i % n === k).length !== 1 ||
        s.board.filter((v, i) => v === 1 && s.regions[i] === k).length !== 1
      )
        return false;
    }
    return s.board.every(
      (v, i) =>
        v !== 1 || S.neighbors(i, n, true).every((j) => s.board[j] !== 1),
    );
  }
  S.puzzle({
    n,
    initial,
    valid,
    tools: [
      [1, "Gwiazda"],
      [-1, "Wyklucz"],
      [0, "×"],
    ],
    text: (s, i) => (s.board[i] === 1 ? "★" : s.board[i] === -1 ? "×" : ""),
    decorate(b, i, s) {
      for (const [side, j] of [
        ["Top", i - 6],
        ["Left", i % 6 ? i - 1 : -1],
        ["Right", i % 6 < 5 ? i + 1 : -1],
        ["Bottom", i + 6],
      ])
        if (j < 0 || j >= 36 || s.regions[i] !== s.regions[j])
          b.style["border" + side + "Width"] = "3px";
      b.style.background = `color-mix(in srgb,var(--paper) ${93 - s.regions[i] * 4}%,var(--accent))`;
    },
    hint: "Dokładnie jedna gwiazda w każdym wierszu, kolumnie i obszarze grubych granic. Gwiazdy nie mogą stykać się nawet narożnikami.",
  });
})();
