(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["CZAS", "PRZECIĘCIA", "PRZESUNIĘCIA"]),
    W = 720,
    T = 480,
    { canvas, ctx, point } = H.canvas(W, T);
  let s,
    history = [],
    drag = -1;
  const edges = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      if (c < 2) edges.push([i, i + 1]);
      if (r < 2) edges.push([i, i + 3]);
      if (c < 2 && r < 2) edges.push([i, i + 4]);
    }
  const orient = (a, b, c) =>
      (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x),
    on = (a, b, c) =>
      Math.abs(orient(a, b, c)) < 0.001 &&
      c.x >= Math.min(a.x, b.x) - 0.001 &&
      c.x <= Math.max(a.x, b.x) + 0.001 &&
      c.y >= Math.min(a.y, b.y) - 0.001 &&
      c.y <= Math.max(a.y, b.y) + 0.001;
  function intersects(a, b, c, d) {
    const p = orient(a, b, c),
      q = orient(a, b, d),
      r = orient(c, d, a),
      t = orient(c, d, b);
    return (
      (p * q < 0 && r * t < 0) ||
      on(a, b, c) ||
      on(a, b, d) ||
      on(c, d, a) ||
      on(c, d, b)
    );
  }
  function crossings(points = s.points) {
    const bad = new Set();
    for (let i = 0; i < edges.length; i++)
      for (let j = 0; j < i; j++) {
        if (edges[i].some((v) => edges[j].includes(v))) continue;
        const [a, b] = edges[i],
          [c, d] = edges[j];
        if (intersects(points[a], points[b], points[c], points[d])) {
          bad.add(i);
          bad.add(j);
        }
      }
    let overlap = 0;
    for (let i = 0; i < points.length; i++)
      for (let j = 0; j < i; j++)
        if (
          Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) < 24
        )
          overlap++;
    return { count: bad.size + overlap, edges: [...bad] };
  }
  function newGame() {
    const solution = Array.from({ length: 9 }, (_, i) => ({
      x: 160 + (i % 3) * 200,
      y: 80 + Math.floor(i / 3) * 160,
    }));
    let points = S.shuffle(
      Array.from({ length: 9 }, (_, i) => ({
        x: 360 + 190 * Math.cos((i / 9) * Math.PI * 2),
        y: 240 + 190 * Math.sin((i / 9) * Math.PI * 2),
      })),
    );
    if (!crossings(points).count)
      [points[0], points[4]] = [points[4], points[0]];
    s = { points, solution, selected: 0, moves: 0 };
    history = [];
    drag = -1;
    H.reset();
    H.say("Przeciągnij punkty, aż wszystkie linie przestaną się przecinać.");
    render();
    draw();
  }
  function move(i, x, y, save = true) {
    if (
      !H.active() ||
      !Number.isInteger(i) ||
      i < 0 ||
      i >= 9 ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    )
      return false;
    H.start();
    if (save) history.push(S.clone(s));
    s.points[i] = { x: S.clamp(x, 24, W - 24), y: S.clamp(y, 24, T - 24) };
    s.selected = i;
    if (save) s.moves++;
    if (!crossings().count)
      H.finish(`Wszystkie linie rozplątane. ${s.moves} przesunięć.`);
    render();
    draw();
    return true;
  }
  function undo() {
    S.undo(H, history, (value) => (s = value));
    draw();
  }
  function draw() {
    if (!s) return;
    const p = S.backdrop(ctx, W, T),
      bad = crossings().edges;
    ctx.lineWidth = 3;
    edges.forEach(([a, b], i) => {
      ctx.strokeStyle = bad.includes(i) ? p.accent : p.green;
      ctx.beginPath();
      ctx.moveTo(s.points[a].x, s.points[a].y);
      ctx.lineTo(s.points[b].x, s.points[b].y);
      ctx.stroke();
    });
    s.points.forEach((v, i) => {
      ctx.fillStyle = i === s.selected ? p.accent : p.surface;
      ctx.strokeStyle = p.ink;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = p.ink;
      ctx.textAlign = "center";
      ctx.font = "15px Mono";
      ctx.fillText(i + 1, v.x, v.y + 5);
    });
  }
  function render() {
    if (s) H.stats([S.time(H.elapsed), crossings().count, s.moves]);
  }
  canvas.onpointerdown = (e) => {
    if (e.button !== 0 || !e.isPrimary || !H.active()) return;
    const p = point(e),
      i = s.points.findIndex((v) => Math.hypot(v.x - p.x, v.y - p.y) < 28);
    if (i < 0) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    canvas.focus({ preventScroll: true });
    drag = i;
    H.start();
    history.push(S.clone(s));
    s.moves++;
    s.selected = i;
    render();
    draw();
  };
  canvas.onpointermove = (e) => {
    if (drag < 0 || !H.active()) return;
    const p = point(e);
    move(drag, p.x, p.y, false);
  };
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(name, () => (drag = -1));
  H.button("Cofnij", undo);
  H.keys((key, e) => {
    if (/^[1-9]$/.test(key)) {
      s.selected = Number(key) - 1;
      draw();
      return true;
    }
    const d = {
      ArrowLeft: [-10, 0],
      ArrowRight: [10, 0],
      ArrowUp: [0, -10],
      ArrowDown: [0, 10],
    }[key];
    if (d) {
      const p = s.points[s.selected];
      move(s.selected, p.x + d[0], p.y + d[1]);
      return true;
    }
    if (key.toLowerCase() === "u" && !e.repeat) {
      undo();
      return true;
    }
  });
  H.onPause = () => (drag = -1);
  H.onNew = newGame;
  H.onRender = () => {
    render();
    draw();
  };
  H.onTick = render;
  S.api(H, { move, undo, crossings, intersects, edges, draw }, () => s);
  newGame();
})();
