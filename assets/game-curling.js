(() => {
  "use strict";
  const S = SpinnerHundred;
  let aim;
  function launch(s, Q) {
    if (!Q.H.active() || s.moving || s.stones.length >= 6) return false;
    Q.H.start();
    const a = (s.angle * Math.PI) / 180;
    s.stones.push({
      x: 80,
      y: 240,
      vx: Math.cos(a) * s.power,
      vy: Math.sin(a) * s.power,
    });
    s.moving = true;
    return true;
  }
  function score(s) {
    return s.stones.reduce(
      (sum, b) =>
        sum +
        (Math.hypot(b.x - 590, b.y - 240) < 18
          ? 50
          : Math.hypot(b.x - 590, b.y - 240) < 45
            ? 30
            : Math.hypot(b.x - 590, b.y - 240) < 80
              ? 10
              : 0),
      0,
    );
  }
  S.arcade({
    labels: ["PUNKTY", "KAMIENIE", "SIŁA"],
    binds: [["Szczotkuj", "sweep", ["ArrowUp", "w", "W"]]],
    initial: () => ({ stones: [], moving: false, angle: 0, power: 390 }),
    stats: (s) => [score(s), s.stones.length + " / 6", Math.round(s.power)],
    setup(Q, get) {
      Q.H.button("Puść", () => launch(get(), Q), Q.H.extra);
      const labels = [
        ["angle", "Kąt", -20, 20, 0],
        ["power", "Siła", 180, 490, 390],
      ];
      for (const [id, text, min, max, value] of labels) {
        const wrap = document.createElement("label"),
          input = document.createElement("input");
        wrap.textContent = text;
        input.type = "range";
        input.dataset.stateField = id;
        input.min = min;
        input.max = max;
        input.value = value;
        input.setAttribute("aria-label", text);
        input.oninput = () => {
          if (Q.H.active() && !get().moving) {
            get()[id] = Number(input.value);
            Q.H.render();
          }
        };
        wrap.append(input);
        Q.H.extra.append(wrap);
      }
      return { launch: () => launch(get(), Q), score: () => score(get()) };
    },
    space: launch,
    update(s, Q, dt) {
      if (!s.moving) return;
      for (const b of s.stones) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        const speed = Math.hypot(b.vx, b.vy),
          decel = Q.keys.has("sweep") ? 90 : 150,
          f = Math.max(0, speed - decel * dt) / (speed || 1);
        b.vx *= f;
        b.vy *= f;
        if (b.x < 24 || b.x > 696) {
          b.x = S.clamp(b.x, 24, 696);
          b.vx *= -0.65;
        }
        if (b.y < 40 || b.y > 440) {
          b.y = S.clamp(b.y, 40, 440);
          b.vy *= -0.65;
        }
      }
      for (let i = 0; i < s.stones.length; i++)
        for (let j = 0; j < i; j++) {
          const a = s.stones[i],
            b = s.stones[j],
            dx = b.x - a.x,
            dy = b.y - a.y,
            d = Math.hypot(dx, dy);
          if (d < 28 && d > 0) {
            const nx = dx / d,
              ny = dy / d,
              overlap = (28 - d) / 2;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
            const impulse = ((a.vx - b.vx) * nx + (a.vy - b.vy) * ny) * 0.88;
            if (impulse > 0) {
              a.vx -= impulse * nx;
              a.vy -= impulse * ny;
              b.vx += impulse * nx;
              b.vy += impulse * ny;
            }
          }
        }
      if (s.stones.every((b) => Math.hypot(b.vx, b.vy) < 1)) {
        s.moving = false;
        for (const b of s.stones) b.vx = b.vy = 0;
        if (s.stones.length === 6)
          Q.H.finish(`Sześć kamieni. Wynik: ${score(s)} punktów.`);
        else {
          Q.H.say("Kamienie stanęły. Możesz wypuścić kolejny.");
          Q.H.render();
        }
      }
    },
    draw(s, Q, p) {
      const c = Q.ctx;
      for (const [r, color] of [
        [80, p.blue],
        [45, p.paper],
        [18, p.accent],
      ])
        S.circle(c, 590, 240, r, color);
      c.strokeStyle = p.grid;
      c.lineWidth = 3;
      c.strokeRect(10, 25, 700, 430);
      for (const b of s.stones) {
        S.circle(c, b.x, b.y, 14, p.ink);
        S.circle(c, b.x, b.y - 3, 6, p.gold);
      }
      if (!s.moving && s.stones.length < 6) {
        c.strokeStyle = p.accent;
        c.beginPath();
        c.moveTo(80, 240);
        c.lineTo(
          80 + Math.cos((s.angle * Math.PI) / 180) * 100,
          240 + Math.sin((s.angle * Math.PI) / 180) * 100,
        );
        c.stroke();
      }
    },
    hint: "Poślij sześć kamieni do domu po prawej. Szczotkowanie zmniejsza tarcie. Kamienie zderzają się i mogą wypychać poprzednie. Punktuje środek kamienia: 50 / 30 / 10.",
  });
})();
