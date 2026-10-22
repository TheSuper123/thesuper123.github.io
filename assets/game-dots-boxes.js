(() => {
  "use strict";
  const H = SpinnerMore.create(["KOLEJKA", "POLA I", "POLA II"]);
  H.board.classList.add("mo-boxes");
  const edges = Array.from({ length: 49 }, (_, i) => i).filter(
    (i) => Math.floor(i / 7) % 2 !== (i % 7) % 2,
  );
  const boxes = Array.from({ length: 49 }, (_, i) => i).filter(
    (i) => Math.floor(i / 7) % 2 === 1 && (i % 7) % 2 === 1,
  );
  const around = (i) => [i - 7, i + 7, i - 1, i + 1];
  const rules = {
    depth: 2,
    initial: () => ({ board: Array(49).fill(0), turn: 1, notice: "" }),
    legal: (s) => edges.filter((i) => !s.board[i]),
    apply(s, i) {
      const board = [...s.board];
      board[i] = s.turn;
      let gain = 0;
      for (const b of boxes)
        if (!board[b] && around(b).every((e) => board[e])) {
          board[b] = s.turn;
          gain++;
        }
      return {
        board,
        turn: gain ? s.turn : 3 - s.turn,
        notice: gain ? `Domknięte pola: ${gain}. Dodatkowy ruch!` : "",
      };
    },
    scores: (s) => [
      boxes.filter((i) => s.board[i] === 1).length,
      boxes.filter((i) => s.board[i] === 2).length,
    ],
    result(s) {
      if (rules.legal(s).length) return null;
      const [a, b] = rules.scores(s);
      return a === b ? 0 : a > b ? 1 : 2;
    },
    evaluate(s, root) {
      const [a, b] = rules.scores(s);
      let score = (a - b) * (root === 1 ? 1 : -1) * 100;
      const vulnerable = boxes.filter(
        (i) => !s.board[i] && around(i).filter((e) => s.board[e]).length === 3,
      ).length;
      return score + vulnerable * (s.turn === root ? 20 : -20);
    },
    draw(s, move) {
      H.grid(
        7,
        Array(49).fill(""),
        (i) => {
          if (edges.includes(i)) move(i);
        },
        (b, i) => {
          const r = Math.floor(i / 7),
            c = i % 7,
            kind = edges.includes(i)
              ? "edge"
              : boxes.includes(i)
                ? "box"
                : "dot";
          b.dataset.kind = kind;
          b.dataset.direction = r % 2 ? "vertical" : "horizontal";
          b.dataset.owner = s.board[i];
          if (kind === "box" && s.board[i])
            b.textContent = s.board[i] === 1 ? "I" : "II";
          b.disabled = kind !== "edge";
          b.setAttribute(
            "aria-label",
            kind === "edge"
              ? `${r % 2 ? "Pionowa" : "Pozioma"} kreska ${r + 1}, ${c + 1}${s.board[i] ? ", zajęta" : ""}`
              : kind === "dot"
                ? "Kropka"
                : "Kwadrat",
          );
        },
      );
    },
  };
  SpinnerTurn.create(H, rules);
})();
