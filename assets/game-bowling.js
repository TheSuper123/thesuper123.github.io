(() => {
  "use strict";
  const S = SpinnerHundred,
    W = 420,
    T = 650;
  function pins() {
    const out = [];
    for (let r = 0; r < 4; r++)
      for (let k = 0; k <= r; k++)
        out.push({
          x: 210 + (k - r / 2) * 34,
          y: 155 - r * 31,
          vx: 0,
          vy: 0,
          down: false,
        });
    return out;
  }
  function scoreFrames(frames) {
    const rolls = frames.flat();
    let at = 0,
      total = 0;
    for (let f = 0; f < 10; f++) {
      const a = rolls[at];
      if (a === undefined) break;
      if (a === 10) {
        if (rolls[at + 2] === undefined) break;
        total += 10 + rolls[at + 1] + rolls[at + 2];
        at++;
      } else {
        const b = rolls[at + 1];
        if (b === undefined) break;
        if (a + b === 10) {
          if (rolls[at + 2] === undefined) break;
          total += 10 + rolls[at + 2];
        } else total += a + b;
        at += 2;
      }
    }
    return total;
  }
  function throwBall(s, Q) {
    if (!Q.H.active() || s.moving) return false;
    Q.H.start();
    s.before = s.pins.filter((p) => p.down).length;
    s.ball = { x: 210, y: 595, vx: s.aim * 0.8, vy: -360 };
    s.moving = true;
    s.time = 0;
    s.shots++;
    return true;
  }
  function endThrow(s, Q) {
    const down = s.pins.filter((p) => p.down).length,
      hit = down - s.before,
      frame = s.frames[s.frame];
    frame.push(hit);
    s.moving = false;
    if (s.frame < 9) {
      if (frame[0] === 10 || frame.length === 2) {
        s.frame++;
        s.pins = pins();
      }
    } else if (
      frame.length === 3 ||
      (frame.length === 2 && frame[0] !== 10 && frame[0] + frame[1] !== 10)
    ) {
      Q.H.finish(`Dziesięć rund. Wynik: ${scoreFrames(s.frames)} punktów.`);
      return;
    } else if (down === 10) s.pins = pins();
    s.ball = null;
    Q.H.say(
      `${hit} kręgli. ${hit === 10 ? "Strike! " : ""}Przygotuj kolejny rzut.`,
    );
    Q.H.render();
  }
  S.arcade({
    width: W,
    height: T,
    labels: ["PUNKTY", "RUNDA", "RZUTY"],
    initial: () => ({
      pins: pins(),
      frames: Array.from({ length: 10 }, () => []),
      frame: 0,
      aim: 0,
      ball: null,
      moving: false,
      time: 0,
      before: 0,
      shots: 0,
    }),
    stats: (s) => [
      scoreFrames(s.frames),
      Math.min(10, s.frame + 1) + " / 10",
      s.shots,
    ],
    setup(Q, get) {
      const label = document.createElement("label"),
        input = document.createElement("input");
      label.textContent = "Kierunek";
      input.type = "range";
      input.dataset.stateField = "aim";
      input.min = -90;
      input.max = 90;
      input.value = 0;
      input.setAttribute("aria-label", "Kierunek rzutu");
      input.oninput = () => {
        if (Q.H.active() && !get().moving) {
          get().aim = Number(input.value);
          Q.H.render();
        }
      };
      label.append(input);
      Q.H.extra.append(label);
      Q.H.button("Rzuć", () => throwBall(get(), Q), Q.H.extra);
      return {
        throwBall: () => throwBall(get(), Q),
        scoreFrames,
        endThrow: () => endThrow(get(), Q),
      };
    },
    space: throwBall,
    update(s, Q, dt) {
      if (!s.moving) return;
      s.time += dt;
      const b = s.ball;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const gutter = b.x < 72 || b.x > 348;
      for (const pin of s.pins) {
        pin.x += pin.vx * dt;
        pin.y += pin.vy * dt;
        pin.vx *= Math.exp(-2 * dt);
        pin.vy *= Math.exp(-2 * dt);
        if (!gutter && Math.hypot(b.x - pin.x, b.y - pin.y) < 22) {
          pin.down = true;
          pin.vx += (pin.x - b.x) * 8 + b.vx * 0.6;
          pin.vy += b.vy * 0.7;
          b.vy *= 0.86;
        }
      }
      for (let i = 0; i < s.pins.length; i++)
        for (let j = 0; j < i; j++) {
          const a = s.pins[i],
            b = s.pins[j],
            d = Math.hypot(a.x - b.x, a.y - b.y);
          if (
            d < 19 &&
            d > 0 &&
            (Math.hypot(a.vx, a.vy) > 15 || Math.hypot(b.vx, b.vy) > 15)
          ) {
            a.down = b.down = true;
            const nx = (a.x - b.x) / d,
              ny = (a.y - b.y) / d,
              impulse = ((b.vx - a.vx) * nx + (b.vy - a.vy) * ny) * 0.6;
            if (impulse > 0) {
              a.vx += impulse * nx;
              a.vy += impulse * ny;
              b.vx -= impulse * nx;
              b.vy -= impulse * ny;
            }
            a.x += (nx * (19 - d)) / 2;
            a.y += (ny * (19 - d)) / 2;
            b.x -= (nx * (19 - d)) / 2;
            b.y -= (ny * (19 - d)) / 2;
          }
        }
      if (s.time > 4 || (b.y < -30 && s.time > 2.5)) endThrow(s, Q);
    },
    draw(s, Q, p) {
      const c = Q.ctx;
      c.fillStyle = p.gold;
      c.fillRect(68, 25, 284, 600);
      c.fillStyle = p.shadow;
      c.fillRect(55, 25, 13, 600);
      c.fillRect(352, 25, 13, 600);
      c.strokeStyle = p.paper;
      c.beginPath();
      c.moveTo(70, 550);
      c.lineTo(350, 550);
      c.stroke();
      for (const pin of s.pins) {
        S.circle(
          c,
          pin.x,
          pin.y,
          pin.down ? 5 : 9,
          pin.down ? p.muted : p.paper,
        );
        if (!pin.down) {
          c.strokeStyle = p.accent;
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(pin.x - 5, pin.y);
          c.lineTo(pin.x + 5, pin.y);
          c.stroke();
        }
      }
      if (s.ball) S.circle(c, s.ball.x, s.ball.y, 12, p.blue);
      else {
        S.circle(c, 210, 595, 12, p.blue);
        c.strokeStyle = p.ink;
        c.beginPath();
        c.moveTo(210, 580);
        c.lineTo(210 + s.aim * 0.5, 370);
        c.stroke();
      }
      c.fillStyle = p.ink;
      c.font = "13px monospace";
      c.fillText(s.frames.map((f) => f.join(",") || "·").join(" | "), 10, 643);
    },
    hint: "Dziesięć rund kręgli. Strike daje premię dwóch następnych rzutów, spare jednego. W ostatniej rundzie są rzuty premiowe. Ustaw kierunek, rzuć i obserwuj zderzenia.",
  });
})();
