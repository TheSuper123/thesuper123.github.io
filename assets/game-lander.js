(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["LĄDOWISKO", "PALIWO", "PRĘDKOŚĆ W DÓŁ"]),
    W = 720,
    T = 480,
    M = S.motion(H, W, T),
    { ctx, keys } = M;
  let s;
  const pads = [
    { x: 500, y: 430, w: 145 },
    { x: 100, y: 410, w: 120 },
    { x: 450, y: 390, w: 95 },
  ];
  M.bind("↶ Obrót", "left", ["ArrowLeft", "a", "A"]);
  M.bind("↑ Silnik", "thrust", ["ArrowUp", "w", "W"]);
  M.bind("Obrót ↷", "right", ["ArrowRight", "d", "D"]);
  function resetShip() {
    s.ship = { x: s.level % 2 ? 130 : 600, y: 60, vx: 0, vy: 0, angle: 0 };
    s.fuel = 100;
    H.say(
      `Ląduj na zaznaczonym polu. Próby: ${s.lives}. Prędkość pionowa < 28, pozioma < 18, przechył < 11°.`,
    );
  }
  function newGame() {
    s = { level: 1, lives: 3, ship: {}, fuel: 100 };
    keys.clear();
    resetShip();
    H.reset();
    render();
  }
  function crash() {
    s.lives--;
    if (!s.lives) {
      H.finish("Lądownik stracił trzecią próbę.", false);
      return;
    }
    keys.clear();
    resetShip();
  }
  function update(dt) {
    const p = s.ship,
      pad = pads[s.level - 1],
      oldBottom = p.y + 13;
    p.angle = S.clamp(
      p.angle +
        ((keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0)) * 1.15 * dt,
      -0.7,
      0.7,
    );
    p.vy += 34 * dt;
    if (keys.has("thrust") && s.fuel > 0) {
      p.vx += Math.sin(p.angle) * 72 * dt;
      p.vy -= Math.cos(p.angle) * 72 * dt;
      s.fuel = Math.max(0, s.fuel - 7 * dt);
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y < 14) {
      p.y = 14;
      p.vy = Math.max(0, p.vy);
    }
    if (p.x < 12 || p.x > W - 12 || p.y > 451) {
      crash();
      render();
      return;
    }
    if (p.x + 11 > pad.x && p.x - 11 < pad.x + pad.w && p.y + 13 >= pad.y) {
      const safe =
        oldBottom <= pad.y &&
        p.x - 11 >= pad.x &&
        p.x + 11 <= pad.x + pad.w &&
        p.vy >= 0 &&
        p.vy < 28 &&
        Math.abs(p.vx) < 18 &&
        Math.abs(p.angle) < 0.19;
      if (!safe) crash();
      else if (s.level === 3) {
        H.record("lander", s.lives * 100 + Math.round(s.fuel));
        H.finish("Trzy bezpieczne lądowania. Misja wykonana!");
      } else {
        s.level++;
        keys.clear();
        resetShip();
      }
    }
    render();
  }
  function draw() {
    if (!s) return;
    const p = S.backdrop(ctx, W, T),
      pad = pads[s.level - 1];
    ctx.fillStyle = p.ink;
    ctx.fillRect(0, 455, W, 25);
    ctx.fillStyle = p.green;
    ctx.fillRect(pad.x, pad.y, pad.w, T - pad.y);
    ctx.fillStyle = p.paper;
    ctx.font = "16px Mono";
    ctx.textAlign = "center";
    ctx.fillText("H", pad.x + pad.w / 2, pad.y + 24);
    const ship = s.ship;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = p.accent;
    ctx.fillRect(-10, -10, 20, 19);
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-9, 6);
    ctx.lineTo(-15, 14);
    ctx.moveTo(9, 6);
    ctx.lineTo(15, 14);
    ctx.stroke();
    if (keys.has("thrust") && s.fuel > 0) {
      ctx.fillStyle = p.gold;
      ctx.beginPath();
      ctx.moveTo(-5, 10);
      ctx.lineTo(0, 26);
      ctx.lineTo(5, 10);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = p.muted;
    ctx.font = "12px Mono";
    ctx.textAlign = "left";
    ctx.fillText(
      `PRZECHYŁ ${Math.round((ship.angle * 180) / Math.PI)}° · W BOK ${Math.round(Math.abs(ship.vx))} · PRÓBY ${s.lives}`,
      20,
      27,
    );
  }
  function render() {
    if (s)
      H.stats([
        `${s.level} / 3`,
        Math.round(s.fuel) + "%",
        Math.round(s.ship.vy),
      ]);
  }
  H.button("Rozpocznij lot", () => H.start(), H.controls, "ng-primary");
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  S.api(
    H,
    {
      update,
      pads,
      advance: (dt) => S.advance(H, update, dt),
      getState: () => s,
      draw,
    },
    () => s,
  );
  newGame();
})();
