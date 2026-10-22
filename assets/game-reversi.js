(() => {
  "use strict";
  const H = SpinnerMore.create(["KOLEJKA", "KRĄŻKI I", "KRĄŻKI II"]);
  H.board.classList.add("mo-disc");
  function flips(board, index, player) {
    if (board[index]) return [];
    const row = Math.floor(index / 8),
      col = index % 8,
      all = [];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const ray = [];
        let r = row + dr,
          c = col + dc;
        while (
          r >= 0 &&
          r < 8 &&
          c >= 0 &&
          c < 8 &&
          board[r * 8 + c] === 3 - player
        ) {
          ray.push(r * 8 + c);
          r += dr;
          c += dc;
        }
        if (
          ray.length &&
          r >= 0 &&
          r < 8 &&
          c >= 0 &&
          c < 8 &&
          board[r * 8 + c] === player
        )
          all.push(...ray);
      }
    return all;
  }
  const moves = (board, p) =>
    board.flatMap((v, i) => (!v && flips(board, i, p).length ? [i] : []));
  const rules = {
    depth: 3,
    flips,
    initial() {
      const board = Array(64).fill(0);
      board[27] = board[36] = 2;
      board[28] = board[35] = 1;
      return { board, turn: 1, notice: "" };
    },
    legal: (s) => moves(s.board, s.turn),
    apply(s, index) {
      const board = [...s.board];
      board[index] = s.turn;
      for (const i of flips(s.board, index, s.turn)) board[i] = s.turn;
      let turn = 3 - s.turn,
        notice = "";
      if (!moves(board, turn).length && moves(board, s.turn).length) {
        notice = `Gracz ${turn === 1 ? "I" : "II"} nie ma ruchu. Kolejka wraca.`;
        turn = s.turn;
      }
      return { board, turn, notice };
    },
    scores: (s) => [
      s.board.filter((v) => v === 1).length,
      s.board.filter((v) => v === 2).length,
    ],
    result(s) {
      if (moves(s.board, 1).length || moves(s.board, 2).length) return null;
      const [a, b] = rules.scores(s);
      return a === b ? 0 : a > b ? 1 : 2;
    },
    evaluate(s, root) {
      let score = 0;
      for (let i = 0; i < 64; i++) {
        if (!s.board[i]) continue;
        const r = Math.floor(i / 8),
          c = i % 8,
          corner = (r === 0 || r === 7) && (c === 0 || c === 7),
          near = (r <= 1 || r >= 6) && (c <= 1 || c >= 6);
        const value = corner
          ? 180
          : near
            ? -25
            : r === 0 || r === 7 || c === 0 || c === 7
              ? 15
              : 2;
        score += (s.board[i] === root ? 1 : -1) * value;
      }
      return (
        score +
        (moves(s.board, root).length - moves(s.board, 3 - root).length) * 8
      );
    },
    draw(s, move) {
      const legal = moves(s.board, s.turn);
      H.grid(8, Array(64).fill(""), move, (b, i) => {
        b.dataset.owner = s.board[i];
        b.dataset.legal = String(legal.includes(i));
        b.setAttribute(
          "aria-label",
          `${String.fromCharCode(65 + (i % 8))}${Math.floor(i / 8) + 1}: ${s.board[i] ? "gracz " + s.board[i] : legal.includes(i) ? "dozwolony ruch" : "puste"}`,
        );
      });
    },
  };
  SpinnerTurn.create(H, rules);
})();
