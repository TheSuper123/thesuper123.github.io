(() => {
  "use strict";
  const S = SpinnerHundred,
    W = 480,
    T = 650;
  S.arcade({
    width: W,
    height: T,
    labels: ["BRAMKI", "POMYŁKI", "TRASA"],
    binds: [
      ["← Skręt", "left", ["ArrowLeft", "a", "A"]],
      ["Skręt →", "right", ["ArrowRight", "d", "D"]],
    ],
    initial: () => ({
      x: 240,
      vx: 0,
      distance: 0,
      speed: 150,
      passed: 0,
      misses: 0,
      gates: Array.from({ length: 20 }, (_, i) => ({
        z: 420 + i * 260,
        x: 240 + Math.sin(i * 1.4) * 115,
        done: false,
      })),
    }),
    stats: (s) => [
      s.passed + " / 20",
      s.misses + " / 5",
      Math.min(100, Math.floor((s.distance / 5500) * 100)) + "%",
    ],
    update(s, Q, dt) {
      const turn = (Q.keys.has("right") ? 1 : 0) - (Q.keys.has("left") ? 1 : 0);
      s.vx += (turn * 620 - s.vx * 3) * dt;
      s.x = S.clamp(s.x + s.vx * dt, 30, W - 30);
      s.distance += s.speed * dt;
      s.speed = Math.min(250, 150 + s.distance * 0.018);
      for (const g of s.gates)
        if (!g.done && s.distance >= g.z) {
          g.done = true;
          if (Math.abs(s.x - g.x) < 65) s.passed++;
          else {
            s.misses++;
            Q.H.say("Brak bramki. Celuj pomiędzy tyczki.");
          }
        }
      if (s.misses >= 5)
        Q.H.finish(`Pięć pominiętych bramek. Zaliczono ${s.passed}.`, false);
      else if (s.distance >= 5500)
        Q.H.finish(`Meta! Bramki ${s.passed} / 20, pomyłki ${s.misses}.`);
    },
    draw(s, Q, p) {
      const c = Q.ctx;
      c.strokeStyle = p.grid;
      c.lineWidth = 2;
      for (let y = -100; y < T; y += 80) {
        const yy = (y + s.distance * 0.4) % T;
        c.beginPath();
        c.moveTo(25, yy);
        c.lineTo(15, yy + 25);
        c.moveTo(455, yy);
        c.lineTo(465, yy + 25);
        c.stroke();
      }
      for (const g of s.gates) {
        const y = 200 + g.z - s.distance;
        if (y < -30 || y > T + 30) continue;
        c.strokeStyle = p.accent;
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(g.x - 65, y - 20);
        c.lineTo(g.x - 65, y + 20);
        c.moveTo(g.x + 65, y - 20);
        c.lineTo(g.x + 65, y + 20);
        c.stroke();
        c.fillStyle = p.accent;
        c.fillRect(g.x - 65, y - 20, 20, 12);
        c.fillRect(g.x + 45, y - 20, 20, 12);
      }
      S.circle(c, s.x, 185, 10, p.ink);
      c.strokeStyle = p.ink;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(s.x - 7, 195);
      c.lineTo(s.x - 10 + s.vx * 0.03, 224);
      c.moveTo(s.x + 7, 195);
      c.lineTo(s.x + 10 + s.vx * 0.03, 224);
      c.stroke();
      c.strokeStyle = p.gold;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(s.x - 15 + s.vx * 0.03, 215);
      c.lineTo(s.x - 8 + s.vx * 0.03, 238);
      c.moveTo(s.x + 8 + s.vx * 0.03, 215);
      c.lineTo(s.x + 15 + s.vx * 0.03, 238);
      c.stroke();
    },
    hint: "Przejedź przez dwadzieścia bramek slalomu. Skręt ma bezwładność, a prędkość rośnie. Pięć pominięć kończy przejazd. Celuj środkiem narciarza między tyczki.",
  });
})();
