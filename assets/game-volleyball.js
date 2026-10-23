(() => {
  "use strict";
  const S = SpinnerHundred;
  function reset(s, server) {
    s.players = [
      { x: 170, y: 395, vy: 0 },
      { x: 550, y: 395, vy: 0 },
    ];
    s.ball = {
      x: server === 1 ? 170 : 550,
      y: 245,
      vx: server === 1 ? 95 : -95,
      vy: -130,
    };
    s.wait = 0.65;
  }
  function jump(s, Q) {
    if (!Q.H.active()) return false;
    Q.H.start();
    if (s.players[0].y >= 394) {
      s.players[0].vy = -360;
      return true;
    }
    return false;
  }
  function collide(ball, p) {
    const dx = ball.x - p.x,
      dy = ball.y - p.y,
      d = Math.hypot(dx, dy);
    if (d >= 43 || d === 0) return false;
    const nx = dx / d,
      ny = dy / d;
    ball.x = p.x + nx * 43;
    ball.y = p.y + ny * 43;
    const relative = ball.vx * nx + (ball.vy - p.vy) * ny;
    if (relative < 0) {
      ball.vx -= 1.8 * relative * nx;
      ball.vy -= 1.8 * relative * ny;
    }
    ball.vy = Math.min(-200, ball.vy - 80);
    ball.vx = S.clamp(ball.vx + (p.x < 360 ? 45 : -45), -310, 310);
    return true;
  }
  S.arcade({
    labels: ["TY", "KOMPUTER", "DO"],
    binds: [
      ["←", "left", ["ArrowLeft", "a", "A"]],
      ["→", "right", ["ArrowRight", "d", "D"]],
    ],
    initial() {
      const s = { scores: [0, 0], players: [], ball: {}, wait: 0 };
      reset(s, 1);
      return s;
    },
    stats: (s) => [s.scores[0], s.scores[1], 7],
    setup(Q, get) {
      Q.H.button("Skok ↑", () => jump(get(), Q), Q.H.extra);
      Q.H.keys((k, e) => {
        if (["ArrowUp", "w", "W"].includes(k) && !e.repeat) {
          jump(get(), Q);
          return true;
        }
      });
      return { jump: () => jump(get(), Q), collide };
    },
    space: jump,
    update(s, Q, dt) {
      if (s.wait > 0) {
        s.wait -= dt;
        return;
      }
      const me = s.players[0],
        cpu = s.players[1];
      me.x = S.clamp(
        me.x +
          ((Q.keys.has("right") ? 1 : 0) - (Q.keys.has("left") ? 1 : 0)) *
            240 *
            dt,
        35,
        320,
      );
      const target = s.ball.x > 365 ? S.clamp(s.ball.x, 395, 685) : 550;
      cpu.x += S.clamp(target - cpu.x, -185 * dt, 185 * dt);
      if (
        s.ball.x > 365 &&
        Math.abs(s.ball.x - cpu.x) < 50 &&
        s.ball.y > 205 &&
        s.ball.y < 320 &&
        cpu.y >= 394
      )
        cpu.vy = -350;
      for (const p of s.players) {
        p.vy += 800 * dt;
        p.y = Math.min(395, p.y + p.vy * dt);
        if (p.y === 395) p.vy = 0;
      }
      const b = s.ball;
      b.vy += 500 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 14 || b.x > 706) {
        b.x = S.clamp(b.x, 14, 706);
        b.vx *= -0.85;
      }
      if (b.y < 14) {
        b.y = 14;
        b.vy = Math.abs(b.vy) * 0.8;
      }
      for (const p of s.players) collide(b, p);
      if (b.y > 285 && b.x > 340 && b.x < 380) {
        if (b.y - b.vy * dt <= 285) {
          b.y = 285;
          b.vy = -Math.abs(b.vy) * 0.75;
        } else {
          b.x = b.x < 360 ? 340 : 380;
          b.vx = -b.vx * 0.85;
        }
      }
      if (b.y >= 435) {
        const winner = b.x < 360 ? 2 : 1;
        s.scores[winner - 1]++;
        if (s.scores[winner - 1] === 7) {
          Q.H.finish(
            winner === 1
              ? "Wygrywasz mecz do siedmiu!"
              : "Komputer wygrywa mecz do siedmiu.",
            winner === 1,
          );
          return;
        }
        reset(s, winner);
        Q.H.say(
          `Punkt dla ${winner === 1 ? "ciebie" : "komputera"}. Nowa piłka.`,
        );
        Q.H.render();
      }
    },
    draw(s, Q, p) {
      const c = Q.ctx;
      c.fillStyle = p.gold;
      c.fillRect(0, 450, 720, 30);
      c.fillStyle = p.muted;
      c.fillRect(355, 300, 10, 150);
      c.strokeStyle = p.ink;
      c.lineWidth = 2;
      c.strokeRect(355, 300, 10, 150);
      for (let i = 0; i < 2; i++) {
        const player = s.players[i];
        S.circle(c, player.x, player.y, 29, i ? p.ink : p.accent);
        S.circle(c, player.x + (i ? -8 : 8), player.y - 7, 4, p.paper);
      }
      S.circle(c, s.ball.x, s.ball.y, 14, p.paper);
      c.strokeStyle = p.accent;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(s.ball.x, s.ball.y, 14, 0, Math.PI * 2);
      c.stroke();
    },
    hint: "Przerzuć piłkę nad siatką. Lewo/prawo: bieg, góra lub przycisk: skok. Odbicie zależy od miejsca kontaktu. Rywal to lokalny komputer. Pierwsza strona z siedmioma punktami wygrywa.",
  });
})();
