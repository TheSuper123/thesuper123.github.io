(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6;
  function valid(s) {
    const white = s.board.flatMap((v, i) => (v !== -1 ? [i] : []));
    if (!S.connected(white, n)) return false;
    for (let i = 0; i < 36; i++)
      if (s.board[i] === -1 && S.neighbors(i, n).some((j) => s.board[j] === -1))
        return false;
    for (let k = 0; k < n; k++)
      for (const row of [
        Array.from({ length: n }, (_, c) => k * n + c),
        Array.from({ length: n }, (_, r) => r * n + k),
      ]) {
        const values = row
          .filter((i) => s.board[i] !== -1)
          .map((i) => s.numbers[i]);
        if (new Set(values).size !== values.length) return false;
      }
    return true;
  }
  S.puzzle({
    n,
    initial() {
      const numbers = S.latinBoard(n),
        solution = Array(36).fill(0),
        candidates = S.shuffle([...Array(36).keys()]);
      for (const i of candidates)
        if (
          solution.filter((v) => v === -1).length < 7 &&
          S.neighbors(i, n).every((j) => solution[j] !== -1)
        ) {
          solution[i] = -1;
          if (
            !S.connected(
              solution.flatMap((v, j) => (v !== -1 ? [j] : [])),
              n,
            )
          ) {
            solution[i] = 0;
            continue;
          }
          const sameRow = Array.from(
            { length: n },
            (_, c) => Math.floor(i / n) * n + c,
          ).filter((j) => j !== i && solution[j] !== -1);
          numbers[i] = numbers[S.shuffle(sameRow)[0]];
        }
      return { board: Array(36).fill(0), numbers, solution, moves: 0 };
    },
    valid,
    tools: [
      [-1, "Skreśl"],
      [1, "Zostaw"],
      [0, "×"],
    ],
    text: (s, i) => s.numbers[i],
    hint: "Skreśl powtarzające się liczby: pozostałe nie powtarzają się w wierszu ani kolumnie. Skreślone pola nie stykają się bokiem, a reszta pozostaje połączona.",
  });
})();
