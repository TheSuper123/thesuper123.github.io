(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["PUNKTY", "PIŁKI", "CELE"]),
    W = 480,
    T = 680,
    M = S.motion(H, W, T),
    { ctx, keys } = M;
  let s;
  const bumpers = [
    [140, 150, 28],
    [340, 150, 28],
    [240, 260, 30],
    [110, 350, 23],
    [370, 350, 23],
  ];
  M.bind("← Łapka", "left", ["ArrowLeft", "a", "A"]);
  H.button("Podaj · Spacja", launch, H.extra, "ng-primary");
  M.bind("Łapka →", "right", ["ArrowRight", "d", "D"]);
  function newGame() {
    s = {
      ball: { x: 435, y: 610, vx: 0, vy: 0 },
      balls: 3,
      score: 0,
      targets: [false, false, false],
      serving: true,
      left: 0.3,
      right: Math.PI - 0.3,
      time: 0,
      bumpAt: Array(5).fill(-1),
    };
    keys.clear();
    H.reset();
    H.say("Podaj piłkę. Łapki działają przy przytrzymaniu.");
    render();
  }
  function launch() {
    if (!H.active() || !s.serving) return false;
    H.start();
    s.ball = { x: 435, y: 610, vx: -85, vy: -690 };
    s.serving = false;
    return true;
  }
  function segment(ball, a, b, angular = 0, pivot = a) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      t = S.clamp(
        ((ball.x - a.x) * dx + (ball.y - a.y) * dy) / (dx * dx + dy * dy),
        0,
        1,
      ),
      x = a.x + t * dx,
      y = a.y + t * dy,
      nx = ball.x - x,
      ny = ball.y - y,
      d = Math.hypot(nx, ny);
    if (d >= 11) return false;
    const n = d
        ? { x: nx / d, y: ny / d }
        : { x: -dy / Math.hypot(dx, dy), y: dx / Math.hypot(dx, dy) },
      surfaceX = -angular * (y - pivot.y),
      surfaceY = angular * (x - pivot.x),
      relative = (ball.vx - surfaceX) * n.x + (ball.vy - surfaceY) * n.y;
    ball.x = x + n.x * 11;
    ball.y = y + n.y * 11;
    if (relative < 0) {
      ball.vx -= 1.8 * relative * n.x;
      ball.vy -= 1.8 * relative * n.y;
    }
    return true;
  }
  function update(dt) {
    s.time += dt;
    const oldL = s.left,
      oldR = s.right,
      approach = (v, target) => v + S.clamp(target - v, -14 * dt, 14 * dt);
    s.left = approach(s.left, keys.has("left") ? -0.5 : 0.3);
    s.right = approach(
      s.right,
      keys.has("right") ? Math.PI + 0.5 : Math.PI - 0.3,
    );
    if (s.serving) return;
    const b = s.ball;
    b.vy += 400 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= Math.pow(0.999, dt * 120);
    b.vy *= Math.pow(0.999, dt * 120);
    if (b.x < 24) {
      b.x = 24;
      b.vx = Math.abs(b.vx) * 0.92;
    }
    if (b.x > W - 24) {
      b.x = W - 24;
      b.vx = -Math.abs(b.vx) * 0.92;
    }
    if (b.y < 24) {
      b.y = 24;
      b.vy = Math.abs(b.vy) * 0.92;
    }
    bumpers.forEach(([x, y, r], i) => {
      const dx = b.x - x,
        dy = b.y - y,
        d = Math.hypot(dx, dy);
      if (d < r + 8) {
        const nx = d ? dx / d : 1,
          ny = d ? dy / d : 0;
        b.x = x + nx * (r + 8);
        b.y = y + ny * (r + 8);
        const speed = Math.max(360, Math.hypot(b.vx, b.vy));
        b.vx = nx * speed;
        b.vy = ny * speed;
        if (s.time - s.bumpAt[i] > 0.12) {
          s.score += 25;
          s.bumpAt[i] = s.time;
        }
      }
    });
    for (let i = 0; i < 3; i++)
      if (Math.abs(b.x - (140 + i * 100)) < 23 && b.y < 76 && !s.targets[i]) {
        s.targets[i] = true;
        s.score += 100;
        b.vy = Math.abs(b.vy);
        if (s.targets.every(Boolean)) {
          s.score += 250;
          s.targets.fill(false);
        }
      }
    for (const [a, c] of [
      [
        { x: 20, y: 490 },
        { x: 125, y: 580 },
      ],
      [
        { x: 460, y: 490 },
        { x: 355, y: 580 },
      ],
    ])
      segment(b, a, c);
    for (const [pivot, angle, old] of [
      [{ x: 135, y: 580 }, s.left, oldL],
      [{ x: 345, y: 580 }, s.right, oldR],
    ])
      segment(
        b,
        pivot,
        {
          x: pivot.x + Math.cos(angle) * 100,
          y: pivot.y + Math.sin(angle) * 100,
        },
        (angle - old) / dt,
        pivot,
      );
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > 950) {
      b.vx *= 950 / speed;
      b.vy *= 950 / speed;
    }
    if (b.y > T + 12) {
      s.balls--;
      H.record("pinball", s.score);
      if (!s.balls) H.finish(`Stół zamknięty. Wynik: ${s.score}.`, false);
      else {
        s.serving = true;
        s.ball = { x: 435, y: 610, vx: 0, vy: 0 };
        H.say("Następna piłka czeka na podanie.");
      }
    }
    render();
  }
  function draw() {
    if (!s) return;
    const p = S.backdrop(ctx, W, T);
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(20, 640);
    ctx.lineTo(20, 20);
    ctx.lineTo(460, 20);
    ctx.lineTo(460, 640);
    ctx.stroke();
    bumpers.forEach(([x, y, r], i) => {
      ctx.fillStyle = i % 2 ? p.green : p.gold;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.paper;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = s.targets[i] ? p.accent : p.muted;
      ctx.fillRect(120 + i * 100, 45, 40, 15);
    }
    ctx.strokeStyle = p.muted;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(20, 490);
    ctx.lineTo(125, 580);
    ctx.moveTo(460, 490);
    ctx.lineTo(355, 580);
    ctx.stroke();
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 15;
    ctx.lineCap = "round";
    for (const [x, angle] of [
      [135, s.left],
      [345, s.right],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, 580);
      ctx.lineTo(x + 100 * Math.cos(angle), 580 + 100 * Math.sin(angle));
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.fillStyle = p.ink;
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  function render() {
    if (s)
      H.stats([s.score, s.balls, s.targets.filter(Boolean).length + " / 3"]);
  }
  H.keys((key, e) => {
    if (key === " " && !e.repeat) {
      launch();
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  S.api(
    H,
    {
      launch,
      update,
      segment,
      bumpers,
      advance: (dt) => S.advance(H, update, dt),
      getState: () => s,
      draw,
    },
    () => s,
  );
  newGame();
})();
