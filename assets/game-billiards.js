(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["WBITE BILE", "UDERZENIA", "SIŁA"]),
    W = 720,
    T = 420,
    { canvas, ctx, point } = H.canvas(W, T),
    pockets = [
      [25, 25],
      [360, 20],
      [695, 25],
      [25, 395],
      [360, 400],
      [695, 395],
    ];
  let s,
    dragging = false;
  function newGame() {
    const rack = [
      [500, 210],
      [522, 199],
      [522, 221],
      [544, 188],
      [544, 210],
      [544, 232],
    ];
    s = {
      balls: [
        { x: 180, y: 210, vx: 0, vy: 0, active: true, id: 0 },
        ...rack.map(([x, y], i) => ({
          x,
          y,
          vx: 0,
          vy: 0,
          active: true,
          id: i + 1,
        })),
      ],
      angle: 0,
      power: 450,
      shots: 0,
      moving: false,
      scratch: false,
    };
    dragging = false;
    H.reset();
    H.say(
      "Przeciągnij od białej w kierunku uderzenia. Wyraźny strzał ma dłuższą linię.",
    );
    render();
  }
  function shoot(angle = s.angle, power = s.power) {
    if (
      !H.active() ||
      s.moving ||
      s.shots >= 10 ||
      !Number.isFinite(angle) ||
      !Number.isFinite(power)
    )
      return false;
    H.start();
    s.angle = angle;
    s.power = S.clamp(power, 100, 650);
    const cue = s.balls[0];
    cue.vx = Math.cos(angle) * s.power;
    cue.vy = Math.sin(angle) * s.power;
    s.shots++;
    s.moving = true;
    s.scratch = false;
    render();
    return true;
  }
  function collide(a, b) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      d = Math.hypot(dx, dy);
    if (d >= 20) return false;
    const nx = d ? dx / d : 1,
      ny = d ? dy / d : 0,
      overlap = (20 - d) / 2;
    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;
    const relative = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if (relative > 0) {
      const impulse = relative * 0.97;
      a.vx -= impulse * nx;
      a.vy -= impulse * ny;
      b.vx += impulse * nx;
      b.vy += impulse * ny;
    }
    return true;
  }
  function update(dt) {
    if (!s.moving) return;
    for (const b of s.balls) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const friction = Math.exp(-1.2 * dt);
      b.vx *= friction;
      b.vy *= friction;
      if (Math.hypot(b.vx, b.vy) < 4) b.vx = b.vy = 0;
      if (pockets.some(([x, y]) => Math.hypot(b.x - x, b.y - y) < 19)) {
        b.active = false;
        b.vx = b.vy = 0;
        if (!b.id) {
          s.scratch = true;
          s.shots = Math.min(10, s.shots + 1);
        }
        continue;
      }
      if (b.x < 35) {
        b.x = 35;
        b.vx = Math.abs(b.vx) * 0.9;
      }
      if (b.x > W - 35) {
        b.x = W - 35;
        b.vx = -Math.abs(b.vx) * 0.9;
      }
      if (b.y < 35) {
        b.y = 35;
        b.vy = Math.abs(b.vy) * 0.9;
      }
      if (b.y > T - 35) {
        b.y = T - 35;
        b.vy = -Math.abs(b.vy) * 0.9;
      }
    }
    for (let i = 0; i < s.balls.length; i++)
      for (let j = 0; j < i; j++)
        if (s.balls[i].active && s.balls[j].active)
          collide(s.balls[j], s.balls[i]);
    if (!s.balls.some((b) => b.active && (b.vx || b.vy))) {
      s.moving = false;
      if (s.scratch) {
        const cue = s.balls[0];
        let x = 120,
          y = 210;
        for (
          let k = 0;
          k < 20 &&
          s.balls.some((b) => b.active && Math.hypot(b.x - x, b.y - y) < 24);
          k++
        )
          y = 45 + k * 16;
        Object.assign(cue, { active: true, x, y, vx: 0, vy: 0 });
        H.say("Biała w łuzie. Dodatkowa próba odjęta; biała wraca na stół.");
      }
      if (s.balls.slice(1).every((b) => !b.active)) {
        H.record("billiards", s.shots, true, "uderzeń");
        H.finish(`Sześć bil w łuzach. Uderzenia: ${s.shots}.`);
      } else if (s.shots >= 10)
        H.finish(
          `Koniec prób. Wbite bile: ${s.balls.slice(1).filter((b) => !b.active).length} / 6.`,
          false,
        );
      else if (!s.scratch) H.say("Bile stanęły. Zaplanuj następne uderzenie.");
    }
    render();
  }
  function aim(e) {
    if (!H.active() || s.moving) return;
    const p = point(e),
      cue = s.balls[0];
    s.angle = Math.atan2(p.y - cue.y, p.x - cue.x);
    s.power = S.clamp(Math.hypot(p.x - cue.x, p.y - cue.y) * 3.5, 100, 650);
    H.render();
  }
  canvas.onpointerdown = (e) => {
    if (e.button !== 0 || !e.isPrimary || !H.active() || s.moving) return;
    const p = point(e),
      cue = s.balls[0];
    if (Math.hypot(p.x - cue.x, p.y - cue.y) > 45) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    dragging = true;
    aim(e);
  };
  canvas.onpointermove = (e) => {
    if (dragging) aim(e);
  };
  canvas.onpointerup = (e) => {
    if (!dragging) return;
    dragging = false;
    shoot();
  };
  for (const name of ["pointercancel", "lostpointercapture"])
    canvas.addEventListener(name, () => (dragging = false));
  function draw() {
    if (!s) return;
    const p = SpinnerTheme.palette;
    ctx.fillStyle = p.ink;
    ctx.fillRect(0, 0, W, T);
    ctx.fillStyle = p.green;
    ctx.fillRect(20, 20, W - 40, T - 40);
    ctx.fillStyle = p.board;
    for (const [x, y] of pockets) {
      ctx.beginPath();
      ctx.arc(x, y, 19, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of s.balls)
      if (b.active) {
        ctx.fillStyle = b.id
          ? [p.gold, p.blue, p.red, p.violet, p.accent, p.pink][b.id - 1]
          : p.paper;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    if (!s.moving && H.active()) {
      const cue = s.balls[0],
        length = s.power / 4;
      ctx.strokeStyle = p.paper;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(
        cue.x + Math.cos(s.angle) * length,
        cue.y + Math.sin(s.angle) * length,
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  function render() {
    if (s)
      H.stats([
        `${s.balls.slice(1).filter((b) => !b.active).length} / 6`,
        `${s.shots} / 10`,
        Math.round(s.power),
      ]);
  }
  H.button(
    "↶ Kąt",
    () => {
      if (H.active()) {
        s.angle -= 0.1;
        H.render();
      }
    },
    H.extra,
  );
  H.button("Uderz · Spacja", () => shoot(), H.extra, "ng-primary");
  H.button(
    "Kąt ↷",
    () => {
      if (H.active()) {
        s.angle += 0.1;
        H.render();
      }
    },
    H.extra,
  );
  H.keys((key, e) => {
    if (key === " " && !e.repeat) {
      shoot();
      return true;
    }
    if (key === "ArrowLeft" || key === "ArrowRight") {
      s.angle += key === "ArrowLeft" ? -0.05 : 0.05;
      H.render();
      return true;
    }
    if (key === "ArrowUp" || key === "ArrowDown") {
      s.power = S.clamp(s.power + (key === "ArrowUp" ? 25 : -25), 100, 650);
      H.render();
      return true;
    }
  });
  H.onPause = () => (dragging = false);
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  S.api(
    H,
    {
      shoot,
      update,
      collide,
      pockets,
      advance: (dt) => S.advance(H, update, dt),
      getState: () => s,
      draw,
    },
    () => s,
  );
  newGame();
})();
