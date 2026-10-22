(() => {
  "use strict";
  const H = SpinnerThirty.create(["KOLEJKA", "KĘSY I", "KĘSY II"]);
  const rules = {
    depth: 3,
    initial: () => ({
      board: Array(6).fill(8),
      taken: [0, 0],
      turn: 1,
      winner: null,
    }),
    legal: (s) =>
      s.winner
        ? []
        : s.board
            .flatMap((n, r) => Array.from({ length: n }, (_, c) => r * 8 + c))
            .reverse(),
    apply(s, i) {
      const board = [...s.board],
        taken = [...s.taken],
        r = Math.floor(i / 8),
        c = i % 8;
      let amount = 0;
      for (let y = r; y < 6; y++) {
        amount += Math.max(0, board[y] - c);
        board[y] = Math.min(board[y], c);
      }
      taken[s.turn - 1] += amount;
      return {
        board,
        taken,
        turn: 3 - s.turn,
        winner: i === 0 ? 3 - s.turn : null,
      };
    },
    scores: (s) => s.taken,
    result: (s) => s.winner,
    evaluate(s, p) {
      const count = s.board.reduce((a, b) => a + b, 0);
      return (
        (s.turn === p ? 1 : -1) *
        (count === 1 ? -100 : count === 2 ? 100 : count % 2 ? 3 : -3)
      );
    },
    draw(s, play) {
      H.grid(
        8,
        Array.from({ length: 48 }, (_, i) => (i === 0 ? "×" : "")),
        play,
        (b, i) => {
          const eaten = i % 8 >= s.board[Math.floor(i / 8)];
          b.disabled = eaten;
          b.style.visibility = eaten ? "hidden" : "visible";
          b.style.background = i === 0 ? "var(--game-red)" : "var(--game-gold)";
          b.setAttribute(
            "aria-label",
            i === 0
              ? "Zatruty kawałek"
              : `Kawałek ${Math.floor(i / 8) + 1}, ${(i % 8) + 1}`,
          );
        },
      );
    },
  };
  SpinnerTurn.create(H, rules);
})();
