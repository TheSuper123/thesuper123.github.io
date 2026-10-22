(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["CZAS", "WYPEŁNIONE", "KONFLIKTY"]);
  let s,
    history = [];
  const undoButton = H.button("Cofnij", undo);
  H.button("Sprawdź", () =>
    H.say(`Konflikty w liniach: ${conflicts(s.board)}.`),
  );
  for (const [v, label] of [
    [0, "0"],
    [1, "1"],
    [-1, "×"],
  ])
    H.button(label, () => enter(v), H.extra);
  const rowValid = (row) =>
    row.filter((v) => v === 0).length <= 3 &&
    row.filter((v) => v === 1).length <= 3 &&
    !row.some(
      (v, i) => v >= 0 && i >= 2 && v === row[i - 1] && v === row[i - 2],
    );
  function valid(b) {
    const rows = S.lines(b, 6);
    return (
      rows.every((r) => r.every((v) => v === 0 || v === 1) && rowValid(r)) &&
      new Set(rows.slice(0, 6).map((r) => r.join(""))).size === 6 &&
      new Set(rows.slice(6).map((r) => r.join(""))).size === 6
    );
  }
  function generate() {
    const patterns = Array.from({ length: 64 }, (_, v) =>
        Array.from({ length: 6 }, (_, i) => (v >> i) & 1),
      ).filter((r) => r.filter(Boolean).length === 3 && rowValid(r)),
      rows = [];
    function visit() {
      if (rows.length === 6) return valid(rows.flat());
      for (const row of S.shuffle(patterns)) {
        if (rows.some((r) => r.join("") === row.join(""))) continue;
        const partial = [...rows, row];
        if (
          Array.from({ length: 6 }, (_, c) => partial.map((r) => r[c])).some(
            (r) => !rowValid(r),
          )
        )
          continue;
        rows.push(row);
        if (visit()) return true;
        rows.pop();
      }
      return false;
    }
    if (!visit()) throw Error("Takuzu generation failed");
    return rows.flat();
  }
  function conflicts(b) {
    const lines = S.lines(b, 6);
    let n = lines.filter((row) => !rowValid(row)).length;
    for (const group of [lines.slice(0, 6), lines.slice(6)])
      for (let i = 0; i < 6; i++)
        for (let j = 0; j < i; j++)
          if (
            group[i].every((v) => v >= 0) &&
            group[i].join("") === group[j].join("")
          )
            n++;
    return n;
  }
  function newGame() {
    const solution = generate(),
      fixed = Array.from({ length: 36 }, () => Math.random() < 0.34);
    fixed[0] = true;
    s = {
      solution,
      fixed,
      board: solution.map((v, i) => (fixed[i] ? v : -1)),
      selected: fixed.findIndex((v) => !v),
      moves: 0,
    };
    history = [];
    H.reset();
    H.say(
      "Po trzy zera i jedynki. Bez trójek obok siebie i bez identycznych linii.",
    );
    render();
  }
  function enter(value) {
    const i = s.selected;
    if (!H.active() || s.fixed[i] || ![-1, 0, 1].includes(value)) return false;
    H.start();
    history.push(S.clone(s));
    s.board[i] = value;
    s.moves++;
    if (valid(s.board)) H.finish(`Równowaga zachowana. ${s.moves} wpisów.`);
    render();
    return true;
  }
  function choose(i) {
    s.selected = i;
    render();
  }
  function undo() {
    S.undo(H, history, (value) => (s = value));
  }
  function render() {
    H.grid(
      6,
      s.board.map((v) => (v < 0 ? "" : String(v))),
      (i) => {
        if (!H.active()) return;
        s.selected = i;
        if (!s.fixed[i])
          enter(s.board[i] === -1 ? 0 : s.board[i] === 0 ? 1 : -1);
        else render();
      },
      (b, i) => {
        b.dataset.selected = String(i === s.selected);
        b.dataset.fixed = String(s.fixed[i]);
        b.style.color = s.fixed[i] ? "var(--ink)" : "var(--orange)";
        b.onfocus = () => (s.selected = i);
        b.setAttribute(
          "aria-label",
          `Pole ${i + 1}: ${s.board[i] < 0 ? "puste" : s.board[i]}${s.fixed[i] ? ", stałe" : ""}`,
        );
      },
    );
    H.stats([
      S.time(H.elapsed),
      s.board.filter((v) => v >= 0).length + " / 36",
      conflicts(s.board),
    ]);
    undoButton.disabled = !history.length || H.phase === "paused";
  }
  H.keys((key, e) => {
    if (e.repeat) return false;
    if (key === "0" || key === "1") {
      enter(Number(key));
      return true;
    }
    if (["Delete", "Backspace"].includes(key)) {
      enter(-1);
      return true;
    }
    if (key.toLowerCase() === "u") {
      undo();
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = () =>
    H.stats([
      S.time(H.elapsed),
      s.board.filter((v) => v >= 0).length + " / 36",
      conflicts(s.board),
    ]);
  S.api(H, { enter, choose, undo, valid, generate, conflicts }, () => s);
  newGame();
})();
