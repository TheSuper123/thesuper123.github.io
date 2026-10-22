(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["CZAS", "ZGODNE WYSPY", "MOSTY"]);
  H.board.className = "th-bridge-board";
  H.board.dataset.aspect = ".96";
  let s,
    history = [];
  const undoButton = H.button("Cofnij", undo);
  const edges = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      if (c < 2) edges.push([i, i + 1]);
      if (r < 3) edges.push([i, i + 3]);
    }
  const degree = (values) =>
    Array.from({ length: 12 }, (_, i) =>
      edges.reduce((sum, e, k) => sum + (e.includes(i) ? values[k] : 0), 0),
    );
  function connected(values) {
    const found = new Set([0]),
      queue = [0];
    while (queue.length) {
      const i = queue.shift();
      edges.forEach(([a, b], k) => {
        const next = a === i ? b : b === i ? a : -1;
        if (values[k] && next >= 0 && !found.has(next)) {
          found.add(next);
          queue.push(next);
        }
      });
    }
    return found.size === 12;
  }
  function newGame() {
    const solution = Array(edges.length).fill(0),
      found = new Set([0]);
    while (found.size < 12) {
      const choices = edges.flatMap(([a, b], i) =>
          found.has(a) !== found.has(b) ? [i] : [],
        ),
        i = choices[Math.floor(Math.random() * choices.length)];
      solution[i] = 1 + Math.floor(Math.random() * 2);
      edges[i].forEach((v) => found.add(v));
    }
    for (let i = 0; i < solution.length; i++)
      if (!solution[i] && Math.random() < 0.22) solution[i] = 1;
    s = {
      solution,
      clues: degree(solution),
      bridges: Array(edges.length).fill(0),
      selected: -1,
      moves: 0,
    };
    history = [];
    H.reset();
    H.say("Wybierz sąsiednie wyspy. Liczba oznacza sumę mostów.");
    render();
  }
  function toggle(i) {
    if (!H.active() || !Number.isInteger(i) || i < 0 || i >= edges.length)
      return false;
    H.start();
    history.push(S.clone(s));
    s.bridges[i] = (s.bridges[i] + 1) % 3;
    s.selected = -1;
    s.moves++;
    const d = degree(s.bridges);
    if (d.every((v, k) => v === s.clues[k]) && connected(s.bridges))
      H.finish("Wszystkie wyspy połączone, liczby się zgadzają!");
    else
      H.say(
        d.some((v, k) => v > s.clues[k])
          ? "Na jednej z wysp jest za dużo mostów."
          : "Sprawdź liczby i połączenie całej sieci.",
      );
    render();
    return true;
  }
  function choose(i) {
    if (!H.active()) return;
    if (s.selected < 0) s.selected = i;
    else {
      const j = edges.findIndex((e) => e.includes(s.selected) && e.includes(i));
      s.selected = -1;
      if (j >= 0) toggle(j);
    }
    render();
  }
  function undo() {
    S.undo(H, history, (value) => (s = value));
  }
  function render() {
    const points = Array.from({ length: 12 }, (_, i) => [
      50 + (i % 3) * 130,
      50 + Math.floor(i / 3) * 100,
    ]);
    let lines = "";
    edges.forEach(([a, b], i) => {
      const [x, y] = points[a],
        [xx, yy] = points[b],
        vertical = x === xx;
      lines += `<line x1="${x}" y1="${y}" x2="${xx}" y2="${yy}" stroke="var(--line)" stroke-width="2"/>`;
      for (let k = 0; k < s.bridges[i]; k++) {
        const offset = s.bridges[i] === 2 ? (k ? 4 : -4) : 0;
        lines += `<line x1="${x + (vertical ? offset : 0)}" y1="${y + (vertical ? 0 : offset)}" x2="${xx + (vertical ? offset : 0)}" y2="${yy + (vertical ? 0 : offset)}" stroke="var(--orange)" stroke-width="4"/>`;
      }
      lines += `<line data-edge="${i}" class="th-hit-edge" x1="${x}" y1="${y}" x2="${xx}" y2="${yy}" tabindex="0" role="button" aria-label="Most ${a + 1} do ${b + 1}: ${s.bridges[i]}"/>`;
    });
    H.board.innerHTML = `<svg class="th-svg" viewBox="0 0 360 400">${lines}${points.map(([x, y], i) => `<g data-island="${i}" tabindex="0" role="button" aria-label="Wyspa ${i + 1}, wymagane mosty ${s.clues[i]}"><circle class="th-island" data-selected="${i === s.selected}" cx="${x}" cy="${y}" r="20"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-size="21">${s.clues[i]}</text></g>`).join("")}</svg>`;
    H.board.querySelectorAll("[data-edge],[data-island]").forEach((el) => {
      const action = () =>
        el.dataset.edge !== undefined
          ? toggle(Number(el.dataset.edge))
          : choose(Number(el.dataset.island));
      el.onclick = action;
      el.onkeydown = (e) => {
        if (["Enter", " "].includes(e.key)) {
          e.preventDefault();
          action();
        }
      };
    });
    const d = degree(s.bridges);
    H.stats([
      S.time(H.elapsed),
      d.filter((v, i) => v === s.clues[i]).length + " / 12",
      s.bridges.reduce((a, b) => a + b, 0),
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
  S.api(H, { toggle, choose, undo, degree, connected, edges }, () => s);
  newGame();
})();
