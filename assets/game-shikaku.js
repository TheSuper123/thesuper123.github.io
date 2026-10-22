(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["CZAS", "ZAKRYTE POLA", "PROSTOKĄTY"]);
  let s,
    history = [];
  const undoButton = H.button("Cofnij", undo);
  function generate() {
    const rects = [{ r: 0, c: 0, h: 6, w: 6 }];
    for (let k = 0; k < 8; k++) {
      const options = rects.flatMap((v, i) => (v.w > 1 || v.h > 1 ? [i] : []));
      if (!options.length) break;
      const i = options[Math.floor(Math.random() * options.length)],
        a = rects.splice(i, 1)[0],
        vertical = a.w > 1 && (a.h === 1 || Math.random() < 0.5);
      if (vertical) {
        const w = 1 + Math.floor(Math.random() * (a.w - 1));
        rects.push({ ...a, w }, { ...a, c: a.c + w, w: a.w - w });
      } else {
        const h = 1 + Math.floor(Math.random() * (a.h - 1));
        rects.push({ ...a, h }, { ...a, r: a.r + h, h: a.h - h });
      }
    }
    return rects;
  }
  const cells = (rect) =>
    Array.from({ length: rect.h }, (_, r) =>
      Array.from({ length: rect.w }, (_, c) => (rect.r + r) * 6 + rect.c + c),
    ).flat();
  function newGame() {
    const solution = generate(),
      clues = Array(36).fill(0);
    for (const rect of solution) {
      const options = cells(rect);
      clues[options[Math.floor(Math.random() * options.length)]] =
        options.length;
    }
    s = { solution, clues, regions: [], selected: -1, moves: 0 };
    history = [];
    H.reset();
    H.say("Jeden prostokąt zawiera jedną liczbę równą jego polu.");
    render();
  }
  function place(a, b) {
    if (
      !H.active() ||
      ![a, b].every((i) => Number.isInteger(i) && i >= 0 && i < 36)
    )
      return false;
    const r = Math.min(Math.floor(a / 6), Math.floor(b / 6)),
      c = Math.min(a % 6, b % 6),
      rect = {
        r,
        c,
        h: Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + 1,
        w: Math.abs((a % 6) - (b % 6)) + 1,
      },
      list = cells(rect),
      labels = list.filter((i) => s.clues[i]);
    if (
      labels.length !== 1 ||
      s.clues[labels[0]] !== list.length ||
      s.regions.some((other) => cells(other).some((i) => list.includes(i)))
    ) {
      H.say(
        "Obszar musi mieć jedną liczbę równą polu i nie może nachodzić na inny.",
        "error",
      );
      return false;
    }
    H.start();
    history.push(S.clone(s));
    s.regions.push(rect);
    s.selected = -1;
    s.moves++;
    if (s.regions.reduce((sum, r) => sum + r.h * r.w, 0) === 36)
      H.finish(`Cała plansza podzielona. ${s.regions.length} prostokątów.`);
    render();
    return true;
  }
  function choose(i) {
    if (!H.active()) return;
    const region = s.regions.findIndex((r) => cells(r).includes(i));
    if (region >= 0) {
      history.push(S.clone(s));
      s.regions.splice(region, 1);
      s.selected = -1;
      render();
      return;
    }
    if (s.selected < 0) s.selected = i;
    else {
      const a = s.selected;
      s.selected = -1;
      place(a, i);
    }
    render();
  }
  function undo() {
    S.undo(H, history, (value) => (s = value));
  }
  function render() {
    H.grid(
      6,
      s.clues.map((v) => (v ? String(v) : "")),
      choose,
      (b, i) => {
        const region = s.regions.findIndex((r) => cells(r).includes(i));
        if (region >= 0) b.classList.add("th-sector-" + (region % 4));
        b.dataset.selected = String(i === s.selected);
        b.setAttribute(
          "aria-label",
          `Pole ${Math.floor(i / 6) + 1}, ${(i % 6) + 1}${s.clues[i] ? ", pole prostokąta " + s.clues[i] : ""}${region >= 0 ? ", pokryte" : ""}`,
        );
      },
    );
    H.stats([
      S.time(H.elapsed),
      s.regions.reduce((sum, r) => sum + r.h * r.w, 0) + " / 36",
      s.regions.length,
    ]);
    undoButton.disabled = !history.length || H.phase === "paused";
  }
  H.onPause = () => (s.selected = -1);
  H.keys((key, e) => {
    if (key.toLowerCase() === "u" && !e.repeat) {
      undo();
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = () =>
    H.stats([
      S.time(H.elapsed),
      s.regions.reduce((sum, r) => sum + r.h * r.w, 0) + " / 36",
      s.regions.length,
    ]);
  S.api(H, { place, choose, undo, cells, generate }, () => s);
  newGame();
})();
