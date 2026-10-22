(() => {
  "use strict";
  const H = SpinnerMore.create(["TY", "KOMPUTER", "DO ZWYCIĘSTWA"]);
  const W = 720,
    T = 480,
    R = 8,
    PH = 86,
    keys = new Set(),
    { canvas, ctx, point } = H.canvas(W, T);
  let difficulty = "normal",
    s = {},
    dragging = false;
  const configs = {
    easy: { ai: 185, speed: 300, error: 36 },
    normal: { ai: 265, speed: 350, error: 22 },
    hard: { ai: 345, speed: 390, error: 10 },
  };
  H.select(
    "RYWAL",
    [
      ["normal", "Skupiony"],
      ["easy", "Spokojny"],
      ["hard", "Szybki"],
    ],
    (v) => {
      difficulty = v;
      newGame();
    },
  );
  H.extra.classList.add("mo-flight-controls");
  H.hold("↑ Góra", "up", keys);
  const serveButton = H.button("Serwis · Spacja", serve, H.extra, "ng-primary");
  H.hold("↓ Dół", "down", keys);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function newGame() {
    s = {
      py: T / 2,
      cy: T / 2,
      x: W / 2,
      y: T / 2,
      vx: 0,
      vy: 0,
      player: 0,
      cpu: 0,
      serving: true,
      serveDirection: Math.random() < 0.5 ? -1 : 1,
      aiClock: 0,
      aiOffset: 0,
      hits: 0,
    };
    keys.clear();
    dragging = false;
    H.reset();
    H.say("Ustaw paletkę i podaj piłkę. Gramy do siedmiu.");
    render();
  }
  function serve() {
    if (!H.active() || !s.serving) return false;
    H.start();
    const speed = configs[difficulty].speed;
    s.vx = s.serveDirection * speed;
    s.vy = (Math.random() - 0.5) * speed * 0.8;
    s.serving = false;
    H.say("Miejsce trafienia w paletkę zmienia kąt odbicia.");
    render();
    return true;
  }
  function aim(y) {
    if (!H.active() || !Number.isFinite(y)) return;
    s.py = clamp(y, PH / 2 + 8, T - PH / 2 - 8);
    H.render();
  }
  function pointFor(who) {
    s[who]++;
    s.x = W / 2;
    s.y = T / 2;
    s.vx = s.vy = 0;
    s.serving = true;
    s.serveDirection = who === "player" ? 1 : -1;
    if (s[who] >= 7) {
      if (who === "player") H.record("pong:" + difficulty, 7 - s.cpu);
      H.finish(
        `Wynik ${s.player} : ${s.cpu}. ${who === "player" ? "Wygrywasz pojedynek!" : "Tym razem punkt dla komputera."}`,
        who === "player",
      );
    } else
      H.say(`${s.player} : ${s.cpu}. Naciśnij Serwis, gdy będziesz gotowy.`);
    render();
  }
  function bounce(y, direction) {
    const speed = Math.min(760, Math.hypot(s.vx, s.vy) * 1.065),
      angle = clamp((s.y - y) / (PH / 2), -1, 1) * 1.02;
    s.vx = direction * Math.max(170, Math.cos(angle) * speed);
    s.vy = Math.sin(angle) * speed;
    s.hits++;
  }
  function update(dt) {
    if (keys.has("up")) s.py -= 430 * dt;
    if (keys.has("down")) s.py += 430 * dt;
    s.py = clamp(s.py, PH / 2 + 8, T - PH / 2 - 8);
    s.aiClock -= dt;
    if (s.aiClock <= 0) {
      s.aiClock = 0.18;
      s.aiOffset = (Math.random() - 0.5) * configs[difficulty].error;
    }
    const target = s.vx > 0 ? s.y + s.aiOffset : T / 2;
    s.cy = clamp(
      s.cy +
        clamp(
          target - s.cy,
          -configs[difficulty].ai * dt,
          configs[difficulty].ai * dt,
        ),
      PH / 2 + 8,
      T - PH / 2 - 8,
    );
    if (s.serving) return;
    const before = s.x;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.y < R) {
      s.y = R;
      s.vy = Math.abs(s.vy);
    }
    if (s.y > T - R) {
      s.y = T - R;
      s.vy = -Math.abs(s.vy);
    }
    if (
      s.vx < 0 &&
      before >= 44 + R &&
      s.x <= 44 + R &&
      Math.abs(s.y - s.py) <= PH / 2 + R
    ) {
      s.x = 44 + R;
      bounce(s.py, 1);
    }
    if (
      s.vx > 0 &&
      before <= W - 44 - R &&
      s.x >= W - 44 - R &&
      Math.abs(s.y - s.cy) <= PH / 2 + R
    ) {
      s.x = W - 44 - R;
      bounce(s.cy, -1);
    }
    if (s.x < -R) pointFor("cpu");
    else if (s.x > W + R) pointFor("player");
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
    const p = SpinnerMore.backdrop(ctx, W, T);
    ctx.strokeStyle = p.muted;
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, T - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = p.accent;
    ctx.fillRect(30, s.py - PH / 2, 14, PH);
    ctx.fillStyle = p.blue;
    ctx.fillRect(W - 44, s.cy - PH / 2, 14, PH);
    ctx.fillStyle = p.ink;
    ctx.beginPath();
    ctx.arc(s.x, s.y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.13;
    ctx.font = "100px DM";
    ctx.textAlign = "center";
    ctx.fillText(s.player, W * 0.3, 110);
    ctx.fillText(s.cpu, W * 0.7, 110);
    ctx.globalAlpha = 1;
    if (s.serving) {
      ctx.fillStyle = p.muted;
      ctx.font = "14px Mono";
      ctx.fillText("SERWIS / SPACJA", W / 2, T - 30);
    }
  }
  function render() {
    if (!Number.isFinite(s.py)) return;
    H.stats([s.player, s.cpu, "7 pkt"]);
    serveButton.disabled = !s.serving || !H.active();
  }
  canvas.onpointerdown = (e) => {
    if (e.button !== 0 || !e.isPrimary || !H.active()) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    dragging = true;
    aim(point(e).y);
  };
  canvas.onpointermove = (e) => {
    if (H.active() && (dragging || e.pointerType === "mouse")) aim(point(e).y);
  };
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(name, () => (dragging = false));
  H.keys((key, e) => {
    const action = {
      ArrowUp: "up",
      w: "up",
      W: "up",
      ArrowDown: "down",
      s: "down",
      S: "down",
    }[key];
    if (action) {
      keys.add(action);
      return true;
    }
    if (key === " " && !e.repeat) {
      serve();
      return true;
    }
  });
  document.addEventListener("keyup", (e) => {
    const action = {
      ArrowUp: "up",
      w: "up",
      W: "up",
      ArrowDown: "down",
      s: "down",
      S: "down",
    }[e.key];
    if (action) keys.delete(action);
  });
  H.onPause = () => {
    keys.clear();
    dragging = false;
  };
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = render;
  H.loop(update, draw);
  window.MoreGame = {
    newGame,
    serve,
    aim,
    update,
    advance,
    draw,
    get state() {
      return s;
    },
    snapshot: () => ({ ...s, phase: H.phase, difficulty, keys: [...keys] }),
  };
  newGame();
})();
