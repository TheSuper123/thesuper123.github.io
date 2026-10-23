(() => {
  "use strict";
  const S = SpinnerHundred,
    W = 720,
    T = 480;
  function rocks(wave) {
    return Array.from({ length: 3 + wave }, (_, i) => {
      const a = (i / (3 + wave)) * Math.PI * 2;
      return {
        x: 360 + Math.cos(a) * 280,
        y: 240 + Math.sin(a) * 180,
        vx: Math.sin(a) * 35 + 15,
        vy: Math.cos(a) * 35 - 10,
        r: 30,
        size: 2,
        seed: i,
      };
    });
  }
  function shoot(s, Q) {
    if (!Q.H.active() || s.cooldown > 0) return false;
    Q.H.start();
    s.bullets.push({
      x: s.x + Math.cos(s.angle) * 18,
      y: s.y + Math.sin(s.angle) * 18,
      vx: s.vx + Math.cos(s.angle) * 410,
      vy: s.vy + Math.sin(s.angle) * 410,
      life: 1.25,
    });
    s.cooldown = 0.18;
    return true;
  }
  S.arcade({
    labels: ["PUNKTY", "FALA", "OSŁONY"],
    binds: [
      ["↶", "left", ["ArrowLeft", "a", "A"]],
      ["Silnik ↑", "thrust", ["ArrowUp", "w", "W"]],
      ["↷", "right", ["ArrowRight", "d", "D"]],
    ],
    initial: () => ({
      x: 360,
      y: 240,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      rocks: rocks(1),
      bullets: [],
      wave: 1,
      score: 0,
      lives: 3,
      cooldown: 0,
      immune: 2,
    }),
    stats: (s) => [s.score, s.wave + " / 3", s.lives],
    setup(Q, get) {
      Q.H.hold("Ogień", "fire", Q.keys);
      return { shoot: () => shoot(get(), Q) };
    },
    space: shoot,
    update(s, Q, dt) {
      s.cooldown = Math.max(0, s.cooldown - dt);
      s.immune = Math.max(0, s.immune - dt);
      if (Q.keys.has("left")) s.angle -= 3.8 * dt;
      if (Q.keys.has("right")) s.angle += 3.8 * dt;
      if (Q.keys.has("thrust")) {
        s.vx += Math.cos(s.angle) * 230 * dt;
        s.vy += Math.sin(s.angle) * 230 * dt;
      }
      const speed = Math.hypot(s.vx, s.vy);
      if (speed > 260) {
        s.vx *= 260 / speed;
        s.vy *= 260 / speed;
      }
      s.vx *= Math.exp(-0.16 * dt);
      s.vy *= Math.exp(-0.16 * dt);
      s.x = (s.x + s.vx * dt + W) % W;
      s.y = (s.y + s.vy * dt + T) % T;
      if (Q.keys.has("fire")) shoot(s, Q);
      for (const b of s.bullets) {
        b.x = (b.x + b.vx * dt + W) % W;
        b.y = (b.y + b.vy * dt + T) % T;
        b.life -= dt;
      }
      for (const r of s.rocks) {
        r.x = (r.x + r.vx * dt + W) % W;
        r.y = (r.y + r.vy * dt + T) % T;
      }
      for (const b of s.bullets)
        if (b.life > 0) {
          const k = s.rocks.findIndex(
            (r) => Math.hypot(r.x - b.x, r.y - b.y) < r.r,
          );
          if (k >= 0) {
            const r = s.rocks.splice(k, 1)[0];
            b.life = 0;
            s.score += r.size === 2 ? 30 : 60;
            if (r.size === 2)
              for (const sign of [-1, 1])
                s.rocks.push({
                  x: r.x,
                  y: r.y,
                  vx: r.vx + sign * 55,
                  vy: r.vy - sign * 40,
                  r: 15,
                  size: 1,
                  seed: r.seed + sign,
                });
          }
        }
      s.bullets = s.bullets.filter((b) => b.life > 0);
      if (
        !s.immune &&
        s.rocks.some((r) => Math.hypot(r.x - s.x, r.y - s.y) < r.r + 10)
      ) {
        s.lives--;
        s.x = 360;
        s.y = 240;
        s.vx = s.vy = 0;
        s.immune = 2.5;
        if (!s.lives) {
          Q.H.finish(`Statek stracił osłony. Punkty: ${s.score}.`, false);
          return;
        }
      }
      if (!s.rocks.length) {
        if (s.wave === 3)
          Q.H.finish(`Trzy pola asteroid oczyszczone. ${s.score} punktów.`);
        else {
          s.wave++;
          s.rocks = rocks(s.wave);
          s.immune = 2;
          s.bullets = [];
        }
      }
    },
    draw(s, Q, p) {
      const c = Q.ctx;
      for (const r of s.rocks) {
        c.strokeStyle = p.ink;
        c.lineWidth = 2;
        c.beginPath();
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2,
            rr = r.r * (0.8 + 0.2 * Math.sin(i * 9 + r.seed));
          c.lineTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr);
        }
        c.closePath();
        c.stroke();
      }
      for (const b of s.bullets) S.circle(c, b.x, b.y, 3, p.gold);
      c.save();
      c.translate(s.x, s.y);
      c.rotate(s.angle);
      c.strokeStyle = s.immune ? p.green : p.accent;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(18, 0);
      c.lineTo(-12, -11);
      c.lineTo(-7, 0);
      c.lineTo(-12, 11);
      c.closePath();
      c.stroke();
      if (Q.keys.has("thrust")) {
        c.strokeStyle = p.gold;
        c.beginPath();
        c.moveTo(-13, -5);
        c.lineTo(-25, 0);
        c.lineTo(-13, 5);
        c.stroke();
      }
      c.restore();
    },
    hint: "Obracaj statek, używaj silnika i rozbijaj asteroidy. Krawędzie się łączą. Duże skały dzielą się na dwie. Trzy fale i trzy osłony.",
  });
})();
