(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6;
  function visible(b, i) {
    let count = 1;
    const r = Math.floor(i / n),
      c = i % n;
    for (const [dy, dx] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      let y = r + dy,
        x = c + dx;
      while (y >= 0 && y < n && x >= 0 && x < n && b[y * n + x] !== -1) {
        count++;
        y += dy;
        x += dx;
      }
    }
    return count;
  }
  const valid = (s) =>
    s.board.every(
      (v, i) => !s.clues[i] || (v !== -1 && visible(s.board, i) === s.clues[i]),
    ) &&
    s.board.every(
      (v, i) => v !== -1 || S.neighbors(i, n).every((j) => s.board[j] !== -1),
    ) &&
    S.connected(
      s.board.flatMap((v, i) => (v !== -1 ? [i] : [])),
      n,
    );
  S.puzzle({
    n,
    initial() {
      let solution;
      do {
        solution = Array(36).fill(1);
        for (const i of S.shuffle([...Array(36).keys()]))
          if (
            Math.random() < 0.3 &&
            S.neighbors(i, n).every((j) => solution[j] !== -1)
          )
            solution[i] = -1;
      } while (
        !S.connected(
          solution.flatMap((v, i) => (v === 1 ? [i] : [])),
          n,
        )
      );
      const clues = solution.map((v, i) =>
        v === 1 && Math.random() < 0.6 ? visible(solution, i) : 0,
      );
      return {
        solution,
        clues,
        board: clues.map((v) => (v ? 1 : 0)),
        fixed: clues.map(Boolean),
        moves: 0,
      };
    },
    valid,
    tools: [
      [-1, "Czarne"],
      [1, "Białe"],
      [0, "×"],
    ],
    text: (s, i) => s.clues[i] || (s.board[i] === 1 && "·") || "",
    hint: "Liczba to widoczne białe pola w pionie i poziomie, razem z nią. Czarne nie stykają się bokiem. Wszystkie białe tworzą jedną sieć. Puste pole liczy się jako białe.",
  });
  MoreGame.visible = visible;
})();
