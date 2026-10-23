(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6;
  function matching(tents, trees) {
    const owner = new Map();
    function augment(t, seen) {
      for (const tree of trees)
        if (S.neighbors(t, n).includes(tree) && !seen.has(tree)) {
          seen.add(tree);
          if (!owner.has(tree) || augment(owner.get(tree), seen)) {
            owner.set(tree, t);
            return true;
          }
        }
      return false;
    }
    return (
      tents.length === trees.length && tents.every((t) => augment(t, new Set()))
    );
  }
  function valid(s) {
    const tents = s.board.flatMap((v, i) => (v === 1 ? [i] : []));
    return (
      matching(tents, s.trees) &&
      tents.every((i) =>
        S.neighbors(i, n, true).every((j) => s.board[j] !== 1),
      ) &&
      s.rows.every(
        (v, r) => tents.filter((i) => Math.floor(i / n) === r).length === v,
      ) &&
      s.cols.every((v, c) => tents.filter((i) => i % n === c).length === v)
    );
  }
  S.puzzle({
    n,
    goal: "DRZEWO + NAMIOT",
    tools: [
      [1, "Namiot"],
      [-1, "Trawa"],
      [0, "×"],
    ],
    initial() {
      const tents = [],
        trees = [];
      for (const t of S.shuffle([...Array(36).keys()])) {
        if (tents.length >= 7) break;
        if (
          tents.includes(t) ||
          trees.includes(t) ||
          S.neighbors(t, n, true).some((i) => tents.includes(i))
        )
          continue;
        const choices = S.shuffle(S.neighbors(t, n)).filter(
          (i) => !trees.includes(i) && !tents.includes(i),
        );
        if (!choices.length) continue;
        tents.push(t);
        trees.push(choices[0]);
      }
      const solution = Array(36).fill(0);
      tents.forEach((i) => (solution[i] = 1));
      trees.forEach((i) => (solution[i] = 2));
      return {
        board: solution.map((v) => (v === 2 ? 2 : 0)),
        solution,
        trees,
        fixed: solution.map((v) => v === 2),
        rows: Array.from(
          { length: n },
          (_, r) => tents.filter((i) => Math.floor(i / n) === r).length,
        ),
        cols: Array.from(
          { length: n },
          (_, c) => tents.filter((i) => i % n === c).length,
        ),
        moves: 0,
      };
    },
    valid,
    render(H, s, act) {
      const labels = Array.from({ length: 49 }, (_, k) => {
        const r = Math.floor(k / 7) - 1,
          c = (k % 7) - 1;
        if (r < 0) return c < 0 ? "↘" : s.cols[c];
        if (c < 0) return s.rows[r];
        const v = s.board[r * n + c];
        return v === 2 ? "♣" : v === 1 ? "△" : v === -1 ? "·" : "";
      });
      H.grid(
        7,
        labels,
        (k) => {
          const r = Math.floor(k / 7) - 1,
            c = (k % 7) - 1;
          if (r >= 0 && c >= 0) act(r * n + c);
        },
        (b, k) => {
          const r = Math.floor(k / 7) - 1,
            c = (k % 7) - 1;
          b.disabled = r < 0 || c < 0 || s.board[r * n + c] === 2;
          if (r < 0 || c < 0) b.classList.add("hu-black");
        },
      );
    },
    hint: "Każde drzewo ma jeden namiot przy boku, a każdy namiot własne drzewo. Namioty nie stykają się nawet narożnikami. Liczby podają namioty w wierszach i kolumnach.",
  });
  MoreGame.matching = matching;
})();
