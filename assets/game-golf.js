(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["ZDJĘTE KARTY", "DOBIERANIE", "RUCHY"]);
  H.board.className = "th-board-cards";
  H.board.dataset.aspect = "1.2";
  let s,
    history = [];
  const undoButton = H.button("Cofnij", undo);
  H.button("Dobierz", draw, H.controls, "ng-primary");
  function newGame() {
    const deck = S.shuffle(Array.from({ length: 52 }, (_, i) => i));
    s = {
      columns: Array.from({ length: 7 }, () => deck.splice(0, 5)),
      stock: deck,
      base: deck.pop(),
      removed: 0,
      moves: 0,
    };
    history = [];
    H.reset();
    H.say("Zdejmuj karty o jeden wyższe lub niższe. As i król nie łączą się.");
    render();
  }
  const playable = (c) =>
    s.columns[c]?.length &&
    Math.abs(S.rank(s.columns[c].at(-1)) - S.rank(s.base)) === 1;
  function check() {
    if (s.removed === 35) H.finish(`Stół pusty. ${s.moves} ruchów!`);
    else if (!s.stock.length && !s.columns.some((_, i) => playable(i)))
      H.finish(`Brak ruchów i kart w talii. Zdjęte: ${s.removed} / 35.`, false);
  }
  function move(c) {
    if (!H.active() || !playable(c)) return false;
    H.start();
    history.push(S.clone(s));
    s.base = s.columns[c].pop();
    s.removed++;
    s.moves++;
    check();
    render();
    return true;
  }
  function draw() {
    if (!H.active() || !s.stock.length) return false;
    H.start();
    history.push(S.clone(s));
    s.base = s.stock.pop();
    s.moves++;
    check();
    render();
    return true;
  }
  function undo() {
    return S.undo(H, history, (value) => (s = value));
  }
  function render() {
    H.board.replaceChildren();
    const top = document.createElement("div");
    top.className = "th-card-top";
    const stock = document.createElement("div");
    stock.className = "th-slot";
    H.button("✳ " + s.stock.length, draw, stock);
    const base = document.createElement("div");
    base.className = "th-slot";
    S.cardButton(H, s.base, () => {}, base);
    top.append(stock, base);
    const columns = document.createElement("div");
    columns.className = "th-columns";
    columns.style.setProperty("--columns", 7);
    const height = H.board.clientHeight || 420;
    s.columns.forEach((cards, c) => {
      const col = document.createElement("div");
      col.className = "th-column";
      const step = Math.max(4, Math.min(40, (height - 140) / 4));
      cards.forEach((card, i) => {
        const b = S.cardButton(H, card, () => move(c), col);
        b.style.top = i * step + "px";
        b.disabled = i !== cards.length - 1;
        b.dataset.selected = String(i === cards.length - 1 && playable(c));
      });
      columns.append(col);
    });
    H.board.append(top, columns);
    H.stats([`${s.removed} / 35`, s.stock.length, s.moves]);
    undoButton.disabled = !history.length || H.phase === "paused";
  }
  H.keys((key, e) => {
    if (key.toLowerCase() === "u" && !e.repeat) {
      undo();
      return true;
    }
    if (key === " " && !e.repeat) {
      draw();
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  S.api(H, { move, draw, undo, playable, getState: () => s }, () => s);
  newGame();
  new ResizeObserver(render).observe(H.board);
})();
