(() => {
  "use strict";
  const H = SpinnerMore.create(["PIĘTRA", "SZEROKOŚĆ", "REKORD"]),
    W = 480,
    T = 600,
    { canvas, ctx } = H.canvas(W, T);
  let s = {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dropButton = H.button(
    "Zacznij · Spacja",
    () => {},
    H.extra,
    "ng-primary",
  );
  dropButton.onclick = null;
  SpinnerMore.press(dropButton, drop);
  function newGame() {
    s = {
      blocks: [{ x: 100, w: 280, y: 550 }],
      x: 0,
      width: 280,
      direction: 1,
      level: 0,
      speed: 120,
      perfect: 0,
      chips: [],
    };
    H.reset();
    H.record("stack");
    H.say("Zacznij ruch, a potem zatrzymuj klocek nad wieżą. Cel: 25 pięter.");
    render();
  }
  function drop() {
    if (!H.active()) return false;
    if (H.phase === "ready") {
      H.start();
      H.say("Złap właściwy moment. Wystający kawałek odpada.");
      render();
      return true;
    }
    const previous = s.blocks.at(-1),
      perfect = Math.abs(s.x - previous.x) <= 4;
    let x = Math.max(s.x, previous.x),
      width = Math.min(s.x + s.width, previous.x + previous.w) - x;
    if (width <= 0) {
      H.record("stack", s.level);
      H.finish(`Klocek minął wieżę. Wysokość: ${s.level} pięter.`, false);
      render();
      return true;
    }
    if (perfect) {
      x = previous.x;
      width = previous.w;
      s.perfect = 0.7;
      H.say("Równo! Szerokość zostaje.");
    } else {
      if (!reduced) {
        const cutX = s.x < x ? s.x : x + width,
          cutW = s.width - width;
        s.chips.push({
          x: cutX,
          y: 550 - (s.level + 1) * 30,
          w: cutW,
          vx: s.direction * 35,
          vy: 0,
          age: 0,
        });
      }
      H.say(`Zostało ${Math.round(width)} jednostek szerokości.`);
    }
    s.level++;
    s.blocks.push({ x, w: width, y: 550 - s.level * 30 });
    s.width = width;
    s.direction = s.level % 2 ? -1 : 1;
    s.x = s.direction < 0 ? W - width : 0;
    s.speed = Math.min(350, 120 + s.level * 9);
    H.record("stack", s.level);
    if (s.level === 25) H.finish("Dwadzieścia pięć pięter. Wieża gotowa!");
    render();
    return true;
  }
  function update(dt) {
    s.x += s.direction * s.speed * dt;
    const limit = W - s.width;
    if (s.x > limit) {
      s.x = 2 * limit - s.x;
      s.direction = -1;
    }
    if (s.x < 0) {
      s.x = -s.x;
      s.direction = 1;
    }
    s.perfect = Math.max(0, s.perfect - dt);
    for (const chip of s.chips) {
      chip.x += chip.vx * dt;
      chip.vy += 500 * dt;
      chip.y += chip.vy * dt;
      chip.age += dt;
    }
    s.chips = s.chips.filter((c) => c.age < 1.2);
  }
  function advance(dt) {
    let left = Math.min(10, Math.max(0, dt));
    while (left > 0 && H.phase === "playing") {
      const step = Math.min(1 / 120, left);
      update(step);
      left -= step;
    }
  }
  function draw() {
    if (!s.blocks) return;
    const p = SpinnerMore.backdrop(ctx, W, T),
      camera = Math.max(0, s.level - 9) * 30;
    for (let i = 0; i < s.blocks.length; i++) {
      const b = s.blocks[i],
        y = b.y + camera;
      if (y > T) continue;
      ctx.fillStyle = [p.green, p.ink, p.accent][i % 3];
      ctx.fillRect(b.x, y, b.w, 26);
      ctx.fillStyle = p.paper;
      ctx.font = "10px Mono";
      ctx.textAlign = "center";
      if (b.w > 22) ctx.fillText(i, b.x + b.w / 2, y + 17);
    }
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = p.muted;
    ctx.fillRect(
      s.blocks.at(-1).x,
      550 - (s.level + 1) * 30 + camera,
      s.width,
      2,
    );
    ctx.globalAlpha = 1;
    if (H.active() || H.phase === "paused") {
      ctx.fillStyle = p.accent;
      ctx.fillRect(s.x, 550 - (s.level + 1) * 30 + camera, s.width, 26);
    }
    for (const c of s.chips) {
      ctx.globalAlpha = 1 - c.age / 1.2;
      ctx.fillStyle = p.accent;
      ctx.fillRect(c.x, c.y + camera, c.w, 26);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.fillStyle = p.muted;
    ctx.font = "12px Mono";
    ctx.fillText(
      H.phase === "ready"
        ? "ZACZNIJ / SPACJA"
        : s.perfect > 0
          ? "RÓWNO."
          : "ZATRZYMAJ NAD POPRZEDNIM",
      W / 2,
      45,
    );
  }
  function render() {
    if (!s.blocks) return;
    H.stats([
      `${s.level} / 25`,
      Math.round(s.width),
      SpinnerMore.number(SpinnerMore.prefs.get("more:stack", 0)),
    ]);
    dropButton.textContent =
      H.phase === "ready" ? "Zacznij · Spacja" : "Postaw · Spacja";
    dropButton.disabled = !H.active();
  }
  canvas.onpointerdown = (e) => {
    if (e.button !== 0 || !e.isPrimary) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    drop();
  };
  H.keys((key, e) => {
    if ([" ", "Enter"].includes(key) && !e.repeat) {
      drop();
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  window.MoreGame = {
    newGame,
    drop,
    update,
    advance,
    draw,
    get state() {
      return s;
    },
    snapshot: () => JSON.parse(JSON.stringify({ ...s, phase: H.phase })),
  };
  newGame();
})();
