(() => {
  "use strict";
  const H = SpinnerMore.create(["KOLEJKA", "MAGAZYN I", "MAGAZYN II"]);
  H.board.classList.add("mo-kalah");
  const side = (p) => (p === 1 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]);
  const rules = {
    depth: 5,
    initial: () => ({
      board: Array.from({ length: 14 }, (_, i) =>
        i === 6 || i === 13 ? 0 : 4,
      ),
      turn: 1,
      notice: "",
    }),
    legal: (s) => side(s.turn).filter((i) => s.board[i] > 0),
    apply(s, index) {
      const board = [...s.board],
        store = s.turn === 1 ? 6 : 13,
        skip = s.turn === 1 ? 13 : 6;
      let seeds = board[index],
        i = index;
      board[index] = 0;
      while (seeds) {
        i = (i + 1) % 14;
        if (i === skip) continue;
        board[i]++;
        seeds--;
      }
      let notice = "";
      if (side(s.turn).includes(i) && board[i] === 1 && board[12 - i] > 0) {
        const gain = board[12 - i] + 1;
        board[store] += gain;
        board[i] = board[12 - i] = 0;
        notice = `Przejęcie: ${gain} kamieni.`;
      }
      if (side(1).every((j) => !board[j]) || side(2).every((j) => !board[j])) {
        for (const p of [1, 2])
          for (const j of side(p)) {
            board[p === 1 ? 6 : 13] += board[j];
            board[j] = 0;
          }
      }
      const again = i === store;
      return {
        board,
        turn: again ? s.turn : 3 - s.turn,
        notice: again ? "Ostatni kamień w magazynie. Dodatkowy ruch!" : notice,
      };
    },
    scores: (s) => [s.board[6], s.board[13]],
    result(s) {
      if (side(1).some((i) => s.board[i]) && side(2).some((i) => s.board[i]))
        return null;
      return s.board[6] === s.board[13] ? 0 : s.board[6] > s.board[13] ? 1 : 2;
    },
    evaluate(s, root) {
      const stores = (s.board[6] - s.board[13]) * 25,
        stones =
          side(1).reduce((a, i) => a + s.board[i], 0) -
          side(2).reduce((a, i) => a + s.board[i], 0);
      return (root === 1 ? 1 : -1) * (stores + stones);
    },
    draw(s, move) {
      const order = [13, 12, 11, 10, 9, 8, 7, 6, 0, 1, 2, 3, 4, 5];
      H.grid(
        8,
        order.map((i) => String(s.board[i])),
        (i) => move(order[i]),
        (b, k) => {
          const i = order[k],
            store = i === 6 || i === 13;
          b.dataset.pit = i;
          b.dataset.store = String(store);
          b.dataset.side = i <= 6 ? 1 : 2;
          b.dataset.legal = String(
            !store && side(s.turn).includes(i) && s.board[i] > 0,
          );
          b.disabled = store;
          b.style.gridColumn = i === 13 ? "1" : i === 6 ? "8" : "";
          if (store) b.style.gridRow = "1 / span 2";
          b.setAttribute(
            "aria-label",
            `${store ? "Magazyn" : "Dołek"} gracza ${i <= 6 ? "I" : "II"}, ${s.board[i]} kamieni`,
          );
        },
      );
    },
  };
  SpinnerTurn.create(H, rules);
})();
