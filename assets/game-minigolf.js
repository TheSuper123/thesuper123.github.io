(() => {
  "use strict";
  const S = SpinnerHundred,
    holes = [
      {
        start: [85, 240],
        cup: [635, 240],
        walls: [
          [300, 80, 25, 210],
          [430, 280, 25, 120],
        ],
      },
      {
        start: [90, 90],
        cup: [635, 390],
        walls: [
          [180, 160, 340, 24],
          [180, 300, 340, 24],
        ],
      },
      {
        start: [85, 240],
        cup: [630, 240],
        walls: [
          [235, 40, 25, 270],
          [450, 180, 25, 260],
        ],
      },
    ];
  let dragging = false;
  function shoot(s, Q, angle = s.angle, power = s.power) {
    if (
      !Q.H.active() ||
      s.moving ||
      !Number.isFinite(angle) ||
      !Number.isFinite(power)
    )
      return false;
    Q.H.start();
    s.angle = angle;
    s.power = S.clamp(power, 40, 430);
    s.ball.vx = Math.cos(angle) * s.power;
    s.ball.vy = Math.sin(angle) * s.power;
    s.moving = true;
    s.strokes++;
    return true;
  }
  S.arcade({
    labels: ["DOŁEK", "UDERZENIA", "SIŁA"],
    initial() {
      dragging = false;
      return {
        level: 0,
        ball: { x: 85, y: 240, vx: 0, vy: 0 },
        angle: 0,
        power: 240,
        strokes: 0,
        moving: false,
      };
    },
    stats: (s) => [s.level + 1 + " / 3", s.strokes, Math.round(s.power)],
    setup(Q, get) {
      Q.H.button("Uderz", () => shoot(get(), Q), Q.H.extra);
      Q.H.button(
        "Celuj ↶",
        () => {
          if (Q.H.active() && !get().moving) {
            get().angle -= 0.12;
            Q.H.render();
          }
        },
        Q.H.extra,
      );
      Q.H.button(
        "Celuj ↷",
        () => {
          if (Q.H.active() && !get().moving) {
            get().angle += 0.12;
            Q.H.render();
          }
        },
        Q.H.extra,
      );
      for (const d of [-40, 40])
        Q.H.button(
          d < 0 ? "− Siła" : "+ Siła",
          () => {
            if (Q.H.active() && !get().moving) {
              get().power = S.clamp(get().power + d, 40, 430);
              Q.H.render();
            }
          },
          Q.H.extra,
        );
      const aim = (e) => {
        const s = get();
        if (!Q.H.active() || s.moving) return;
        const p = Q.point(e),
          dx = p.x - s.ball.x,
          dy = p.y - s.ball.y;
        s.angle = Math.atan2(dy, dx);
        s.power = S.clamp(Math.hypot(dx, dy) * 2, 40, 430);
        Q.H.render();
      };
      Q.canvas.onpointerdown = (e) => {
        if (e.button || !Q.H.active() || get().moving) return;
        dragging = true;
        Q.canvas.setPointerCapture(e.pointerId);
        aim(e);
      };
      Q.canvas.onpointermove = (e) => {
        if (dragging) aim(e);
      };
      Q.canvas.onpointerup = (e) => {
        if (!dragging) return;
        aim(e);
        dragging = false;
        shoot(get(), Q);
      };
      Q.canvas.onpointercancel = () => (dragging = false);
      window.addEventListener("spinner:input-reset", () => (dragging = false));
      return { shoot: (a, p) => shoot(get(), Q, a, p), holes };
    },
    space: shoot,
    update(s, Q, dt) {
      if (!s.moving) return;
      const b = s.ball,
        level = holes[s.level],
        oldx = b.x,
        oldy = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const speed = Math.hypot(b.vx, b.vy),
        f = Math.max(0, speed - 75 * dt) / (speed || 1);
      b.vx *= f;
      b.vy *= f;
      if (b.x < 22 || b.x > 698) {
        b.x = S.clamp(b.x, 22, 698);
        b.vx *= -0.8;
      }
      if (b.y < 22 || b.y > 458) {
        b.y = S.clamp(b.y, 22, 458);
        b.vy *= -0.8;
      }
      for (const [x, y, w, h] of level.walls)
        if (b.x > x - 8 && b.x < x + w + 8 && b.y > y - 8 && b.y < y + h + 8) {
          if (oldx <= x - 8 || oldx >= x + w + 8) {
            b.x = oldx;
            b.vx *= -0.8;
          } else {
            b.y = oldy;
            b.vy *= -0.8;
          }
        }
      if (
        Math.hypot(b.x - level.cup[0], b.y - level.cup[1]) < 13 &&
        Math.hypot(b.vx, b.vy) < 155
      ) {
        s.level++;
        if (s.level === 3) {
          Q.H.finish(`Trzy dołki w ${s.strokes} uderzeniach.`);
          return;
        }
        const [x, y] = holes[s.level].start;
        s.ball = { x, y, vx: 0, vy: 0 };
        s.moving = false;
        s.angle = 0;
        Q.H.say("Dołek zaliczony. Nowy tor.");
        Q.H.render();
      } else if (Math.hypot(b.vx, b.vy) < 1) {
        b.vx = b.vy = 0;
        s.moving = false;
        Q.H.say("Piłka stanęła. Kolejne uderzenie.");
        Q.H.render();
      }
    },
    draw(s, Q, p) {
      const c = Q.ctx,
        level = holes[Math.min(2, s.level)];
      c.fillStyle = p.green;
      c.fillRect(12, 12, 696, 456);
      c.fillStyle = p.ink;
      for (const w of level.walls) c.fillRect(...w);
      S.circle(c, ...level.cup, 12, p.board);
      c.strokeStyle = p.paper;
      c.beginPath();
      c.moveTo(level.cup[0], level.cup[1]);
      c.lineTo(level.cup[0], level.cup[1] - 45);
      c.stroke();
      c.fillStyle = p.accent;
      c.fillRect(level.cup[0], level.cup[1] - 45, 24, 13);
      S.circle(c, s.ball.x, s.ball.y, 8, p.paper);
      if (!s.moving) {
        c.strokeStyle = p.gold;
        c.beginPath();
        c.moveTo(s.ball.x, s.ball.y);
        c.lineTo(
          s.ball.x + Math.cos(s.angle) * s.power * 0.3,
          s.ball.y + Math.sin(s.angle) * s.power * 0.3,
        );
        c.stroke();
      }
    },
    hint: "Trzy autorskie tory. Przeciągnij od piłki w stronę uderzenia lub użyj celowania i siły. Piłka wpada do dołka przy małej prędkości. Liczy się liczba uderzeń.",
  });
})();
