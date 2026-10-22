(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["FALA", "OSŁONY", "PUNKTY"]),
    W = 720,
    T = 480,
    M = S.motion(H, W, T),
    { ctx, canvas, keys } = M;
  let s;
  M.bind("← Ruch", "left", ["ArrowLeft", "a", "A"]);
  M.bind("● Strzał", "fire", [" "]);
  M.bind("Ruch →", "right", ["ArrowRight", "d", "D"]);
  H.button(
    "Start / strzał",
    () => {
      H.start();
      shoot();
    },
    H.controls,
    "ng-primary",
  );
  function wave() {
    s.enemies = Array.from({ length: 24 }, (_, i) => ({
      x: 100 + (i % 8) * 65,
      y: 65 + Math.floor(i / 8) * 44,
      hp: s.wave === 3 && i < 8 ? 2 : 1,
      id: i,
    }));
    s.offset = 0;
    s.direction = 1;
    s.drop = 0;
    s.enemyShots = [];
    s.fireAt = 0.8;
    s.invincible = 1.8;
    H.say(`Fala ${s.wave} z 3. Traf formację, zanim dotrze na dół.`);
  }
  function newGame() {
    s = {
      wave: 1,
      lives: 3,
      score: 0,
      x: W / 2,
      bullets: [],
      enemies: [],
      enemyShots: [],
      cooldown: 0,
      invincible: 0,
      offset: 0,
      direction: 1,
      drop: 0,
      fireAt: 0,
    };
    keys.clear();
    wave();
    H.reset();
    render();
  }
  function shoot() {
    if (!H.active() || s.cooldown > 0) return false;
    H.start();
    s.bullets.push({ x: s.x, y: T - 52 });
    s.cooldown = 0.22;
    return true;
  }
  function update(dt) {
    s.cooldown = Math.max(0, s.cooldown - dt);
    s.invincible = Math.max(0, s.invincible - dt);
    s.x = S.clamp(
      s.x +
        ((keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0)) * 330 * dt,
      24,
      W - 24,
    );
    if (keys.has("fire")) shoot();
    const speed = 25 + s.wave * 10 + (24 - s.enemies.length) * 3;
    s.offset += s.direction * speed * dt;
    if (s.enemies.length) {
      const min = Math.min(...s.enemies.map((e) => e.x + s.offset)),
        max = Math.max(...s.enemies.map((e) => e.x + s.offset));
      if (min < 28 || max > W - 28) {
        s.offset += min < 28 ? 28 - min : W - 28 - max;
        s.direction *= -1;
        s.drop += 18;
      }
    }
    s.fireAt -= dt;
    if (s.fireAt <= 0 && s.enemies.length) {
      s.fireAt = Math.max(0.3, 1.05 - s.wave * 0.17);
      const e = s.enemies[Math.floor(Math.random() * s.enemies.length)];
      s.enemyShots.push({ x: e.x + s.offset, y: e.y + s.drop + 15 });
    }
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.y -= 550 * dt;
      const e = s.enemies.find(
        (e) =>
          Math.abs(b.x - e.x - s.offset) < 20 &&
          Math.abs(b.y - e.y - s.drop) < 17,
      );
      if (e) {
        e.hp--;
        s.bullets.splice(i, 1);
        if (!e.hp) {
          s.enemies.splice(s.enemies.indexOf(e), 1);
          s.score += 25;
        }
      } else if (b.y < 0) s.bullets.splice(i, 1);
    }
    for (let i = s.enemyShots.length - 1; i >= 0; i--) {
      const b = s.enemyShots[i];
      b.y += (170 + s.wave * 30) * dt;
      if (
        !s.invincible &&
        Math.abs(b.x - s.x) < 19 &&
        Math.abs(b.y - (T - 37)) < 20
      ) {
        s.enemyShots.splice(i, 1);
        s.lives--;
        s.invincible = 1.7;
        if (!s.lives) {
          H.record("invaders", s.score);
          H.finish(`Osłony wyczerpane. Wynik: ${s.score}.`, false);
          return;
        }
      } else if (b.y > T) s.enemyShots.splice(i, 1);
    }
    if (s.enemies.some((e) => e.y + s.drop > T - 75)) {
      H.finish("Formacja dotarła do lądowiska.", false);
      return;
    }
    if (!s.enemies.length) {
      s.score += 100;
      if (s.wave === 3) {
        H.record("invaders", s.score);
        H.finish(`Trzy fale zatrzymane. ${s.score} punktów!`);
      } else {
        s.wave++;
        s.bullets = [];
        wave();
      }
    }
    render();
  }
  function draw() {
    if (!s) return;
    const p = S.backdrop(ctx, W, T);
    for (const e of s.enemies) {
      ctx.fillStyle = e.hp > 1 ? p.blue : p.green;
      ctx.fillRect(e.x + s.offset - 17, e.y + s.drop - 10, 34, 20);
      ctx.fillRect(e.x + s.offset - 23, e.y + s.drop - 3, 46, 7);
      ctx.fillStyle = p.board;
      ctx.fillRect(e.x + s.offset - 9, e.y + s.drop - 5, 4, 4);
      ctx.fillRect(e.x + s.offset + 5, e.y + s.drop - 5, 4, 4);
    }
    ctx.fillStyle = p.accent;
    for (const b of s.bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
    ctx.fillStyle = p.blue;
    for (const b of s.enemyShots) ctx.fillRect(b.x - 3, b.y - 6, 6, 13);
    ctx.save();
    ctx.globalAlpha = s.invincible ? 0.6 : 1;
    ctx.fillStyle = p.ink;
    ctx.beginPath();
    ctx.moveTo(s.x, T - 58);
    ctx.lineTo(s.x - 23, T - 22);
    ctx.lineTo(s.x + 23, T - 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (H.phase === "ready") {
      ctx.fillStyle = p.muted;
      ctx.textAlign = "center";
      ctx.font = "14px Mono";
      ctx.fillText("START / SPACJA", W / 2, T - 95);
    }
  }
  function render() {
    if (s) H.stats([`${s.wave} / 3`, s.lives, s.score]);
  }
  canvas.onpointerdown = (e) => {
    if (e.button === 0 && e.isPrimary) {
      e.preventDefault();
      shoot();
    }
  };
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  S.api(
    H,
    {
      shoot,
      update,
      advance: (dt) => S.advance(H, update, dt),
      getState: () => s,
      draw,
    },
    () => s,
  );
  newGame();
})();
