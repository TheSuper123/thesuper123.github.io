(() => {
  "use strict";
  const S = SpinnerHundred,
    n = 6;
  const jump = (a, b) =>
    Math.abs(Math.floor(a / n) - Math.floor(b / n)) *
      Math.abs((a % n) - (b % n)) ===
    2;
  function tour() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const path = [Math.floor(Math.random() * 36)],
        used = new Set(path);
      while (path.length < 36) {
        const candidates = S.shuffle([...Array(36).keys()]).filter(
          (i) => !used.has(i) && jump(path.at(-1), i),
        );
        candidates.sort(
          (a, b) =>
            [...Array(36).keys()].filter((j) => !used.has(j) && jump(a, j))
              .length -
            [...Array(36).keys()].filter((j) => !used.has(j) && jump(b, j))
              .length,
        );
        if (!candidates.length) break;
        path.push(candidates[0]);
        used.add(candidates[0]);
      }
      if (path.length === 36) return path;
    }
    return [
      0, 8, 4, 17, 28, 32, 24, 13, 2, 6, 19, 30, 26, 34, 21, 10, 23, 15, 11, 3,
      7, 18, 31, 27, 35, 22, 14, 1, 9, 5, 16, 29, 33, 20, 12, 25,
    ];
  }
  S.puzzle({
    n,
    goal: "36 PÓL",
    initial() {
      return { board: Array(36).fill(0), path: [], solution: tour(), moves: 0 };
    },
    action(s, i) {
      if (s.board[i] || (s.path.length && !jump(s.path.at(-1), i)))
        return false;
      s.path.push(i);
      s.board[i] = s.path.length;
    },
    valid: (s) => s.path.length === 36,
    text: (s, i) => s.board[i] || "",
    decorate(b, i, s) {
      b.classList.toggle("th-dark", !!((Math.floor(i / n) + (i % n)) % 2));
      b.dataset.selected = String(s.path.at(-1) === i);
      b.dataset.legal = String(
        !s.board[i] && (!s.path.length || jump(s.path.at(-1), i)),
      );
    },
    hint: "Skoczek chodzi w literę L: dwa pola w jedną stronę i jedno w drugą. Odwiedź każde pole dokładnie raz. Początek jest dowolny; cofaj ślepe zaułki.",
  });
  MoreGame.jump = jump;
})();
