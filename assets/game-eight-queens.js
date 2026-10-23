(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 8;
  const valid = (s) => {
    const queens = s.board.flatMap((v, i) => (v === 1 ? [i] : []));
    return (
      queens.length === 8 &&
      queens.every((i, k) =>
        queens
          .slice(k + 1)
          .every(
            (j) =>
              Math.floor(i / n) !== Math.floor(j / n) &&
              i % n !== j % n &&
              Math.abs(Math.floor(i / n) - Math.floor(j / n)) !==
                Math.abs((i % n) - (j % n)),
          ),
      )
    );
  };
  S.puzzle({
    n,
    initial: () => ({ board: Array(64).fill(0), moves: 0 }),
    valid,
    goal: "8 HETMANÓW",
    text: (s, i) => (s.board[i] === 1 ? "♛" : ""),
    decorate(b, i, s) {
      b.classList.toggle("th-dark", !!((Math.floor(i / n) + (i % n)) % 2));
      if (
        s.board[i] === 1 &&
        s.board.some(
          (v, j) =>
            v === 1 &&
            j !== i &&
            (Math.floor(i / n) === Math.floor(j / n) ||
              i % n === j % n ||
              Math.abs(Math.floor(i / n) - Math.floor(j / n)) ===
                Math.abs((i % n) - (j % n))),
        )
      )
        b.style.color = "var(--accent)";
    },
    hint: "Ustaw osiem hetmanów tak, aby żaden nie atakował innego: osobne wiersze, kolumny i przekątne. Ponowne wybranie pola zdejmuje hetmana.",
  });
})();
