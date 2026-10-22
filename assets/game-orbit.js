(() => {
  "use strict";
  const H = SpinnerMore.create(["FALA", "OSŁONY", "PUNKTY"]),
    W = 720,
    T = 520,
    keys = new Set(),
    { canvas, ctx } = H.canvas(W, T);
  let s = {};
  const TAU = Math.PI * 2,
    wrap = (v, max) => ((v % max) + max) % max;
  const distance = (a, b) =>
    Math.hypot(
      Math.min(Math.abs(a.x - b.x), W - Math.abs(a.x - b.x)),
      Math.min(Math.abs(a.y - b.y), T - Math.abs(a.y - b.y)),
    );
  const startButton = H.button(
    "Start / strzał",
    shoot,
    H.controls,
    "ng-primary",
  );
  H.hold("↶ Obrót", "left", keys);
  H.hold("↑ Ciąg", "thrust", keys);
  H.hold("Obrót ↷", "right", keys);
  H.hold("● Strzał", "fire", keys);
  function rock(x, y, large = true) {
    const angle = Math.random() * TAU,
      speed = (large ? 35 : 70) + Math.random() * 25 + s.wave * 8;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: large ? 32 : 16,
      large,
      angle: Math.random() * TAU,
      spin: (Math.random() - 0.5) * 1.2,
    };
  }
  function wave() {
    s.rocks = [];
    for (let i = 0; i < s.wave + 2; i++) {
      const angle = (TAU * i) / (s.wave + 2) + Math.random() * 0.3;
      s.rocks.push(
        rock(
          wrap(W / 2 + Math.cos(angle) * 300, W),
          wrap(T / 2 + Math.sin(angle) * 235, T),
        ),
      );
    }
    s.ship.invincible = Math.max(s.ship.invincible, 2);
    H.say(`Fala ${s.wave} z 3. Duże skały rozpadają się na dwie mniejsze.`);
  }
  function newGame() {
    s = {
      wave: 1,
      lives: 3,
      score: 0,
      ship: {
        x: W / 2,
        y: T / 2,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2,
        invincible: 2,
      },
      rocks: [],
      bullets: [],
      cooldown: 0,
    };
    keys.clear();
    wave();
    H.reset();
    H.record("orbit");
    H.say(
      "Zacznij, ustaw kierunek i użyj ciągu. Plansza zawija się na krawędziach.",
    );
    render();
  }
  function shoot() {
    if (!H.active()) return false;
    H.start();
    if (s.cooldown > 0) return false;
    s.cooldown = 0.18;
    const ship = s.ship,
      dx = Math.cos(ship.angle),
      dy = Math.sin(ship.angle);
    s.bullets.push({
      x: wrap(ship.x + dx * 18, W),
      y: wrap(ship.y + dy * 18, T),
      vx: dx * 460 + ship.vx * 0.4,
      vy: dy * 460 + ship.vy * 0.4,
      ttl: 1.4,
    });
    return true;
  }
  function update(dt) {
    const ship = s.ship;
    s.cooldown = Math.max(0, s.cooldown - dt);
    ship.invincible = Math.max(0, ship.invincible - dt);
    if (keys.has("left")) ship.angle -= 3.5 * dt;
    if (keys.has("right")) ship.angle += 3.5 * dt;
    if (keys.has("thrust")) {
      ship.vx += Math.cos(ship.angle) * 240 * dt;
      ship.vy += Math.sin(ship.angle) * 240 * dt;
    }
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > 280) {
      ship.vx *= 280 / speed;
      ship.vy *= 280 / speed;
    }
    ship.vx *= Math.pow(0.993, dt * 120);
    ship.vy *= Math.pow(0.993, dt * 120);
    ship.x = wrap(ship.x + ship.vx * dt, W);
    ship.y = wrap(ship.y + ship.vy * dt, T);
    if (keys.has("fire")) shoot();
    for (const r of s.rocks) {
      r.x = wrap(r.x + r.vx * dt, W);
      r.y = wrap(r.y + r.vy * dt, T);
      r.angle += r.spin * dt;
    }
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.x = wrap(b.x + b.vx * dt, W);
      b.y = wrap(b.y + b.vy * dt, T);
      b.ttl -= dt;
      if (b.ttl <= 0) {
        s.bullets.splice(i, 1);
        continue;
      }
      const j = s.rocks.findIndex((r) => distance(b, r) < r.r + 3);
      if (j < 0) continue;
      const hit = s.rocks.splice(j, 1)[0];
      s.bullets.splice(i, 1);
      s.score += hit.large ? 20 : 50;
      if (hit.large) {
        s.rocks.push(rock(hit.x, hit.y, false), rock(hit.x, hit.y, false));
      }
      H.record("orbit", s.score);
    }
    if (
      ship.invincible <= 0 &&
      s.rocks.some((r) => distance(ship, r) < r.r * 0.83 + 9)
    ) {
      s.lives--;
      if (!s.lives) {
        H.finish(`Statek stracił osłony. Wynik: ${s.score}.`, false);
        return;
      }
      Object.assign(ship, {
        x: W / 2,
        y: T / 2,
        vx: 0,
        vy: 0,
        invincible: 2.5,
      });
      H.say(
        `Zderzenie. Osłony: ${s.lives}. Krótka ochrona pozwala wrócić do gry.`,
      );
    }
    if (!s.rocks.length) {
      if (s.wave === 3)
        H.finish(`Trzy fale za Tobą. Bezpieczna orbita! Wynik: ${s.score}.`);
      else {
        s.wave++;
        s.bullets = [];
        wave();
      }
    }
    render();
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
    if (!s.ship) return;
    const p = SpinnerMore.backdrop(ctx, W, T);
    ctx.lineWidth = 2;
    ctx.strokeStyle = p.ink;
    for (const r of s.rocks) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.angle);
      ctx.beginPath();
      for (let k = 0; k < 9; k++) {
        const angle = (k / 9) * TAU,
          rad = r.r * [1, 0.8, 1.08, 0.83, 0.95, 0.76, 1, 0.9, 1.05][k];
        const x = Math.cos(angle) * rad,
          y = Math.sin(angle) * rad;
        if (!k) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = p.accent;
    for (const b of s.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, TAU);
      ctx.fill();
    }
    const ship = s.ship;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.globalAlpha =
      ship.invincible > 0 ? 0.45 + 0.35 * Math.cos(ship.invincible * 15) : 1;
    ctx.fillStyle = p.green;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-11, -10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-11, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (keys.has("thrust")) {
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(-11, -5);
      ctx.lineTo(-25, 0);
      ctx.lineTo(-11, 5);
      ctx.fill();
    }
    ctx.restore();
    if (H.phase === "ready") {
      ctx.fillStyle = p.muted;
      ctx.font = "14px Mono";
      ctx.textAlign = "center";
      ctx.fillText("START / SPACJA", W / 2, T - 30);
    }
  }
  function render() {
    if (s.ship) {
      H.stats([`${s.wave} / 3`, s.lives, s.score]);
      startButton.disabled = !H.active();
    }
  }
  const keyMap = {
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
    ArrowUp: "thrust",
    w: "thrust",
    W: "thrust",
    " ": "fire",
  };
  H.keys((key) => {
    if (!keyMap[key]) return false;
    H.start();
    keys.add(keyMap[key]);
    if (key === " ") shoot();
    return true;
  });
  document.addEventListener("keyup", (e) => {
    if (keyMap[e.key]) keys.delete(keyMap[e.key]);
  });
  canvas.onpointerdown = (e) => {
    if (e.button !== 0 || !e.isPrimary || !H.active()) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    shoot();
  };
  H.onPause = () => keys.clear();
  H.onRender = render;
  H.onNew = newGame;
  H.loop(update, draw);
  window.MoreGame = {
    newGame,
    shoot,
    update,
    advance,
    distance,
    draw,
    get state() {
      return s;
    },
    snapshot: () =>
      JSON.parse(JSON.stringify({ ...s, phase: H.phase, keys: [...keys] })),
  };
  newGame();
})();
