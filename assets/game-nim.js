(() => {
  "use strict";
  const H = SpinnerThirty.create(["KOLEJKA", "ZABRANE I", "ZABRANE II"]);
  H.board.className = "th-heap";
  H.board.dataset.aspect = "1.8";
  const rules = {
    depth: 3,
    initial: () => ({ board: [3, 5, 7], taken: [0, 0], turn: 1 }),
    legal: (s) =>
      s.board.flatMap((n, h) =>
        Array.from({ length: n }, (_, i) => h * 16 + i + 1),
      ),
    apply(s, m) {
      const board = [...s.board],
        taken = [...s.taken],
        h = Math.floor(m / 16),
        n = m % 16;
      board[h] -= n;
      taken[s.turn - 1] += n;
      return { board, taken, turn: 3 - s.turn };
    },
    scores: (s) => s.taken,
    result: (s) => (s.board.every((n) => !n) ? 3 - s.turn : null),
    evaluate(s, p) {
      const winning = Boolean(s.board.reduce((a, n) => a ^ n, 0));
      return (winning ? s.turn === p : s.turn !== p) ? 100 : -100;
    },
    draw(s, play) {
      H.board.replaceChildren(
        ...s.board.map((n, h) => {
          const row = document.createElement("div");
          row.className = "th-heap-row";
          const label = document.createElement("span");
          label.textContent = `STOS ${h + 1}`;
          row.append(label);
          for (let i = 0; i < n; i++) {
            const b = H.button("", () => play(h * 16 + n - i), row);
            b.setAttribute("aria-label", `Zabierz ${n - i} ze stosu ${h + 1}`);
            b.title = `Zabierz ${n - i}`;
          }
          if (!n) {
            const e = document.createElement("span");
            e.textContent = "pusto";
            row.append(e);
          }
          return row;
        }),
      );
    },
  };
  SpinnerTurn.create(H, rules);
})();
