(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6,
    fleet = [3, 2, 2, 1, 1];
  function initial() {
    let solution;
    while (true) {
      solution = Array(36).fill(0);
      let good = true;
      for (const length of fleet) {
        const choices = [];
        for (let i = 0; i < 36; i++)
          for (const step of [1, 6]) {
            const cells = Array.from({ length }, (_, k) => i + k * step);
            if (
              cells.some(
                (j) =>
                  j >= 36 ||
                  (step === 1 && Math.floor(j / 6) !== Math.floor(i / 6)),
              )
            )
              continue;
            if (
              cells.every(
                (j) =>
                  !solution[j] &&
                  S.neighbors(j, n, true).every((k) => !solution[k]),
              )
            )
              choices.push(cells);
          }
        if (!choices.length) {
          good = false;
          break;
        }
        for (const i of S.shuffle(choices)[0]) solution[i] = 1;
      }
      if (good) break;
    }
    const fixed = Array(36).fill(false),
      board = Array(36).fill(0);
    for (const i of S.shuffle([...Array(36).keys()]).slice(0, 3)) {
      fixed[i] = true;
      board[i] = solution[i] || -1;
    }
    return {
      solution,
      board,
      fixed,
      rows: Array.from({ length: 6 }, (_, r) =>
        solution.slice(r * 6, r * 6 + 6).reduce((a, b) => a + b, 0),
      ),
      cols: Array.from({ length: 6 }, (_, c) =>
        solution.filter((_, i) => i % 6 === c).reduce((a, b) => a + b, 0),
      ),
      moves: 0,
    };
  }
  function valid(s) {
    if (
      !s.rows.every(
        (v, r) =>
          s.board.slice(r * 6, r * 6 + 6).filter((v) => v === 1).length === v,
      ) ||
      !s.cols.every(
        (v, c) => s.board.filter((v, i) => i % 6 === c && v === 1).length === v,
      )
    )
      return false;
    const seen = new Set(),
      sizes = [];
    for (let i = 0; i < 36; i++)
      if (s.board[i] === 1) {
        const r = Math.floor(i / n),
          c = i % n;
        for (const dy of [-1, 1])
          for (const dx of [-1, 1])
            if (
              r + dy >= 0 &&
              r + dy < 6 &&
              c + dx >= 0 &&
              c + dx < 6 &&
              s.board[(r + dy) * 6 + c + dx] === 1
            )
              return false;
        if (seen.has(i)) continue;
        const g = [],
          todo = [i];
        while (todo.length) {
          const j = todo.pop();
          if (seen.has(j)) continue;
          seen.add(j);
          g.push(j);
          for (const k of S.neighbors(j, n))
            if (s.board[k] === 1 && !seen.has(k)) todo.push(k);
        }
        if (
          new Set(g.map((i) => Math.floor(i / n))).size !== 1 &&
          new Set(g.map((i) => i % n)).size !== 1
        )
          return false;
        sizes.push(g.length);
      }
    return sizes.sort().join() === fleet.slice().sort().join();
  }
  S.puzzle({
    n,
    initial,
    valid,
    goal: "3 · 2 · 2 · 1 · 1",
    tools: [
      [1, "Okręt"],
      [-1, "Woda"],
      [0, "×"],
    ],
    render(H, s, act) {
      H.grid(
        7,
        Array.from({ length: 49 }, (_, k) => {
          const r = Math.floor(k / 7) - 1,
            c = (k % 7) - 1;
          return r < 0
            ? c < 0
              ? "↘"
              : s.cols[c]
            : c < 0
              ? s.rows[r]
              : s.board[r * n + c] === 1
                ? "■"
                : s.board[r * n + c] === -1
                  ? "·"
                  : "";
        }),
        (k) => {
          const r = Math.floor(k / 7) - 1,
            c = (k % 7) - 1;
          if (r >= 0 && c >= 0) act(r * n + c);
        },
        (b, k) => {
          const r = Math.floor(k / 7) - 1,
            c = (k % 7) - 1;
          b.disabled = r < 0 || c < 0 || !!s.fixed[r * n + c];
          if (r < 0 || c < 0) b.classList.add("hu-black");
          else b.dataset.fixed = String(s.fixed[r * n + c]);
        },
      );
    },
    hint: "Ukryj prostą flotę 3, 2, 2, 1, 1. Okręty nie stykają się nawet narożnikami. Liczby mówią, ile pól zajmują w danym rzędzie i kolumnie. Wskazówki są stałe.",
  });
})();
