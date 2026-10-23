(() => {
  "use strict";
  const S = SpinnerHundred,
    order = [
      20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
    ];
  function hit(x, y) {
    const dx = x - 360,
      dy = y - 240,
      r = Math.hypot(dx, dy);
    if (r < 9) return { value: 50, double: true, label: "Bull 50" };
    if (r < 21) return { value: 25, double: false, label: "25" };
    if (r > 205) return { value: 0, double: false, label: "Pudło" };
    let a = Math.atan2(dx, -dy) + Math.PI / 20;
    if (a < 0) a += Math.PI * 2;
    const base = order[Math.floor(a / ((Math.PI * 2) / 20)) % 20],
      multi = r >= 190 ? 2 : r >= 116 && r <= 130 ? 3 : 1;
    return {
      value: base * multi,
      double: multi === 2,
      label: `${multi === 3 ? "Potrójna " : multi === 2 ? "Podwójna " : ""}${base}`,
    };
  }
  function throwDart(s, Q, x = s.aim.x, y = s.aim.y) {
    if (!Q.H.active() || !Number.isFinite(x) || !Number.isFinite(y))
      return false;
    Q.H.start();
    const result = hit(x, y),
      left = s.remaining[s.turn - 1] - result.value;
    s.darts.push({ x, y, player: s.turn });
    s.thrown++;
    let bust = left < 0 || left === 1 || (left === 0 && !result.double);
    if (bust) {
      s.remaining[s.turn - 1] = s.start;
      Q.H.say("Spalona kolejka: wracasz do wyniku sprzed trzech lotek.");
      s.thrown = 3;
    } else if (left === 0) {
      s.remaining[s.turn - 1] = 0;
      Q.H.finish(
        `Gracz ${s.turn === 1 ? "I" : "II"} zamyka 501 podwójną. Wygrana!`,
      );
      return result;
    } else {
      s.remaining[s.turn - 1] = left;
      Q.H.say(`${result.label}. Pozostało ${left}.`);
    }
    if (s.thrown === 3) {
      s.turn = 3 - s.turn;
      s.start = s.remaining[s.turn - 1];
      s.thrown = 0;
      s.round++;
    }
    Q.H.render();
    return result;
  }
  S.arcade({
    labels: ["KOLEJKA", "I / II", "LOTKA"],
    initial: () => ({
      remaining: [501, 501],
      turn: 1,
      start: 501,
      thrown: 0,
      round: 1,
      darts: [],
      aim: { x: 360, y: 112 },
    }),
    stats: (s) => [
      s.turn === 1 ? "Gracz I" : "Gracz II",
      s.remaining.join(" / "),
      s.thrown + 1 + " / 3",
    ],
    setup(Q, get) {
      Q.H.button("Rzuć", () => throwDart(get(), Q), Q.H.extra);
      for (const [label, dx, dy] of [
        ["←", -4, 0],
        ["↑", 0, -4],
        ["↓", 0, 4],
        ["→", 4, 0],
      ])
        Q.H.button(
          label,
          () => {
            if (Q.H.active()) {
              get().aim.x = S.clamp(get().aim.x + dx, 140, 580);
              get().aim.y = S.clamp(get().aim.y + dy, 20, 460);
              Q.H.render();
            }
          },
          Q.H.extra,
        );
      Q.canvas.onpointerdown = (e) => {
        if (e.button || !Q.H.active()) return;
        const p = Q.point(e);
        get().aim = p;
        Q.H.render();
      };
      Q.H.keys((k, e) => {
        const d = {
          ArrowLeft: [-4, 0],
          ArrowRight: [4, 0],
          ArrowUp: [0, -4],
          ArrowDown: [0, 4],
        }[k];
        if (d) {
          get().aim.x += d[0];
          get().aim.y += d[1];
          Q.H.render();
          return true;
        }
      });
      return { throwDart: (x, y) => throwDart(get(), Q, x, y), hit };
    },
    space: throwDart,
    update() {},
    draw(s, Q, p) {
      const c = Q.ctx;
      for (let i = 0; i < 20; i++) {
        const a = -Math.PI / 2 - Math.PI / 20 + (i * Math.PI) / 10,
          b = a + Math.PI / 10;
        for (const [r, color] of [
          [205, i % 2 ? p.green : p.accent],
          [190, i % 2 ? p.paper : p.ink],
          [130, i % 2 ? p.green : p.accent],
          [116, i % 2 ? p.paper : p.ink],
        ]) {
          c.fillStyle = color;
          c.beginPath();
          c.moveTo(360, 240);
          c.arc(360, 240, r, a, b);
          c.closePath();
          c.fill();
        }
        c.fillStyle = p.ink;
        c.font = "14px monospace";
        c.textAlign = "center";
        c.fillText(
          order[i],
          360 + Math.cos((a + b) / 2) * 221,
          245 + Math.sin((a + b) / 2) * 221,
        );
      }
      S.circle(c, 360, 240, 21, p.green);
      S.circle(c, 360, 240, 9, p.accent);
      for (const dart of s.darts.slice(-6))
        S.circle(c, dart.x, dart.y, 3, dart.player === 1 ? p.blue : p.gold);
      c.strokeStyle = p.blue;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(s.aim.x - 8, s.aim.y);
      c.lineTo(s.aim.x + 8, s.aim.y);
      c.moveTo(s.aim.x, s.aim.y - 8);
      c.lineTo(s.aim.x, s.aim.y + 8);
      c.stroke();
      c.textAlign = "left";
    },
    hint: "Lokalne 501 dla dwóch osób. Wybierz punkt na tarczy, potem rzuć. Trzy lotki na turę. Zakończenie podwójną, środek 50 też jest podwójną. Przekroczenie, reszta 1 lub zero bez podwójnej spalają całą kolejkę.",
  });
})();
