(() => {
  "use strict";
  const H = SpinnerMore.create(["KOLEJKA", "KRĄŻKI I", "KRĄŻKI II"]);
  H.board.classList.add("mo-disc");
  function winner(board) {
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 7; c++) {
        const p = board[r * 7 + c];
        if (!p) continue;
        for (const [dr, dc] of [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, -1],
        ]) {
          const cells = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]);
          if (
            cells.every(
              ([y, x]) =>
                y >= 0 && y < 6 && x >= 0 && x < 7 && board[y * 7 + x] === p,
            )
          )
            return { player: p, cells: cells.map(([y, x]) => y * 7 + x) };
        }
      }
    return null;
  }
  const rules = {
    depth: 5,
    initial: () => ({ board: Array(42).fill(0), turn: 1 }),
    legal: (s) =>
      winner(s.board) ? [] : [3, 2, 4, 1, 5, 0, 6].filter((c) => !s.board[c]),
    apply(s, column) {
      const board = [...s.board];
      let r = 5;
      while (r >= 0 && board[r * 7 + column]) r--;
      if (r >= 0) board[r * 7 + column] = s.turn;
      return { board, turn: 3 - s.turn };
    },
    result(s) {
      return winner(s.board)?.player ?? (s.board.every(Boolean) ? 0 : null);
    },
    scores: (s) => [
      s.board.filter((v) => v === 1).length,
      s.board.filter((v) => v === 2).length,
    ],
    evaluate(s, root) {
      let score = 0;
      for (let r = 0; r < 6; r++)
        score += s.board[r * 7 + 3] === root ? 6 : s.board[r * 7 + 3] ? -6 : 0;
      for (let r = 0; r < 6; r++)
        for (let c = 0; c < 7; c++)
          for (const [dr, dc] of [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1],
          ]) {
            const cells = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]);
            if (cells.some(([y, x]) => y < 0 || y >= 6 || x < 0 || x >= 7))
              continue;
            const values = cells.map(([y, x]) => s.board[y * 7 + x]),
              own = values.filter((v) => v === root).length,
              opp = values.filter((v) => v === 3 - root).length;
            if (!opp) score += [0, 1, 9, 80, 10000][own];
            if (!own) score -= [0, 1, 9, 90, 10000][opp];
          }
      return score;
    },
    draw(s, move) {
      const win = winner(s.board);
      H.grid(
        7,
        Array(42).fill(""),
        (i) => move(i % 7),
        (b, i) => {
          b.dataset.owner = s.board[i];
          b.dataset.win = String(win?.cells.includes(i) || false);
          b.setAttribute(
            "aria-label",
            `Kolumna ${(i % 7) + 1}, rząd ${Math.floor(i / 7) + 1}: ${s.board[i] ? "gracz " + s.board[i] : "puste"}`,
          );
        },
      );
    },
  };
  SpinnerTurn.create(H, rules);
})();
