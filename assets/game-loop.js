(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["CZAS", "ZGODNE POLA", "KRAWĘDZIE"]);
  H.board.className = "th-loop-board";
  H.board.dataset.aspect = "1";
  let s,
    history = [];
  const undoButton = H.button("Cofnij", undo),
    edges = [];
  for (let r = 0; r <= 5; r++)
    for (let c = 0; c < 5; c++) edges.push([r * 6 + c, r * 6 + c + 1]);
  for (let r = 0; r < 5; r++)
    for (let c = 0; c <= 5; c++) edges.push([r * 6 + c, (r + 1) * 6 + c]);
  const around = (i) => {
    const r = Math.floor(i / 5),
      c = i % 5;
    return [r * 5 + c, (r + 1) * 5 + c, 30 + r * 6 + c, 30 + r * 6 + c + 1];
  };
  function valid(values, clues = s.clues) {
    if (
      !values.some(Boolean) ||
      !clues.every(
        (v, i) => v === null || around(i).filter((k) => values[k]).length === v,
      )
    )
      return false;
    const degree = Array(36).fill(0);
    edges.forEach(([a, b], i) => {
      if (values[i]) {
        degree[a]++;
        degree[b]++;
      }
    });
    if (degree.some((v) => v !== 0 && v !== 2)) return false;
    const first = degree.findIndex(Boolean),
      seen = new Set([first]),
      queue = [first];
    while (queue.length) {
      const v = queue.pop();
      edges.forEach(([a, b], i) => {
        const next = a === v ? b : b === v ? a : -1;
        if (values[i] && next >= 0 && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      });
    }
    return degree.every((v, i) => !v || seen.has(i));
  }
  function newGame() {
    const heights = Array.from(
        { length: 5 },
        () => 1 + Math.floor(Math.random() * 4),
      ),
      shape = Array.from(
        { length: 25 },
        (_, i) => Math.floor(i / 5) >= 5 - heights[i % 5],
      ),
      solution = Array(60).fill(false);
    for (let i = 0; i < 25; i++)
      if (shape[i]) for (const k of around(i)) solution[k] = !solution[k];
    const clues = Array.from(
      { length: 25 },
      (_, i) => around(i).filter((k) => solution[k]).length,
    );
    s = { solution, clues, lines: Array(60).fill(false), moves: 0 };
    history = [];
    H.reset();
    H.say("Każda liczba liczy boki swojego pola. Zbuduj jedną pętlę.");
    render();
  }
  function toggle(i) {
    if (!H.active() || !Number.isInteger(i) || i < 0 || i >= 60) return false;
    H.start();
    history.push(S.clone(s));
    s.lines[i] = !s.lines[i];
    s.moves++;
    if (valid(s.lines))
      H.finish(`Jedna poprawna pętla. ${s.moves} zmian krawędzi.`);
    render();
    return true;
  }
  function undo() {
    S.undo(H, history, (value) => (s = value));
  }
  function render() {
    H.board.innerHTML = `<svg class="th-svg" viewBox="0 0 360 360">${s.clues.map((v, i) => `<text x="${60 + (i % 5) * 60}" y="${66 + Math.floor(i / 5) * 60}" text-anchor="middle" font-size="22">${v ?? ""}</text>`).join("")}${edges
      .map(([a, b], i) => {
        const x = 30 + (a % 6) * 60,
          y = 30 + Math.floor(a / 6) * 60,
          xx = 30 + (b % 6) * 60,
          yy = 30 + Math.floor(b / 6) * 60;
        return `<line class="th-edge" data-on="${s.lines[i]}" x1="${x}" y1="${y}" x2="${xx}" y2="${yy}"/><line class="th-hit-edge" data-edge="${i}" tabindex="0" role="button" aria-label="Krawędź ${i + 1}${s.lines[i] ? ", zaznaczona" : ""}" x1="${x}" y1="${y}" x2="${xx}" y2="${yy}"/>`;
      })
      .join(
        "",
      )}${Array.from({ length: 36 }, (_, i) => `<circle cx="${30 + (i % 6) * 60}" cy="${30 + Math.floor(i / 6) * 60}" r="3" fill="var(--ink)"/>`).join("")}</svg>`;
    H.board.querySelectorAll("[data-edge]").forEach((el) => {
      el.onclick = () => toggle(Number(el.dataset.edge));
      el.onkeydown = (e) => {
        if (["Enter", " "].includes(e.key)) {
          e.preventDefault();
          toggle(Number(el.dataset.edge));
        }
      };
    });
    H.stats([
      S.time(H.elapsed),
      s.clues.filter((v, i) => v === around(i).filter((k) => s.lines[k]).length)
        .length + " / 25",
      s.lines.filter(Boolean).length,
    ]);
    undoButton.disabled = !history.length || H.phase === "paused";
  }
  H.keys((key, e) => {
    if (key.toLowerCase() === "u" && !e.repeat) {
      undo();
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  S.api(H, { toggle, undo, valid, around, edges }, () => s);
  newGame();
})();
