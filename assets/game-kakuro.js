(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6;
  const runs = [];
  for (let r = 1; r < n; r++)
    runs.push(Array.from({ length: 5 }, (_, c) => r * n + c + 1));
  for (let c = 1; c < n; c++)
    runs.push(Array.from({ length: 5 }, (_, r) => (r + 1) * n + c));
  const valid = (s) =>
    runs.every((cells, k) => {
      const a = cells.map((i) => s.board[i]);
      return (
        a.every((v) => v >= 1 && v <= 9) &&
        new Set(a).size === a.length &&
        a.reduce((x, y) => x + y, 0) === s.sums[k]
      );
    });
  S.puzzle({
    n,
    goal: "10 SUM",
    tools: Array.from({ length: 9 }, (_, i) => [i + 1, String(i + 1)]).concat([
      [0, "×"],
    ]),
    initial() {
      const digits = S.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5),
        rows = S.shuffle([0, 1, 2, 3, 4]),
        cols = S.shuffle([0, 1, 2, 3, 4]),
        solution = Array(36).fill(0),
        fixed = Array(36).fill(false);
      for (let r = 0; r < 6; r++)
        for (let c = 0; c < 6; c++) {
          const i = r * 6 + c;
          if (!r || !c) fixed[i] = true;
          else solution[i] = digits[(rows[r - 1] + cols[c - 1]) % 5];
        }
      return {
        board: Array(36).fill(0),
        solution,
        fixed,
        sums: runs.map((a) => a.reduce((s, i) => s + solution[i], 0)),
        moves: 0,
      };
    },
    valid,
    action(s, i, v) {
      s.board[i] = v;
    },
    text(s, i) {
      const r = Math.floor(i / n),
        c = i % n;
      return !r && !c
        ? "↘"
        : !c
          ? "→ " + s.sums[r - 1]
          : !r
            ? "↓ " + s.sums[5 + c - 1]
            : s.board[i] || "";
    },
    decorate(b, i) {
      if (i < n || i % n === 0) b.classList.add("hu-black");
    },
    hint: "Wybierz cyfrę i pole. Każda seria musi dać sumę ze strzałki, bez powtarzania cyfr w serii.",
  });
})();
