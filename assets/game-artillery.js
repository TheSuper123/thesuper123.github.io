(() => {
  "use strict";
  const S = SpinnerHundred,
    W = 720,
    T = 480;
  let angleInput, powerInput;
  const ground = (s, x) => s.terrain[S.clamp(Math.floor(x), 0, 719)];
  function fire(s, Q) {
    if (!Q.H.active() || s.shell) return false;
    Q.H.start();
    const tank = s.tanks[s.turn - 1],
      a = (s.angle * Math.PI) / 180,
      dir = s.turn === 1 ? 1 : -1;
    s.shell = {
      x: tank.x,
      y: ground(s, tank.x) - 12,
      vx: Math.cos(a) * s.power * dir,
      vy: -Math.sin(a) * s.power,
      time: 0,
    };
    return true;
  }
  S.arcade({
    labels: ["KOLEJKA", "PANCERZ I", "PANCERZ II"],
    initial: () => ({
      terrain: Array.from(
        { length: 720 },
        (_, x) => 365 + Math.sin(x / 93) * 25 + Math.sin(x / 41) * 9,
      ),
      tanks: [
        { x: 70, hp: 100 },
        { x: 650, hp: 100 },
      ],
      turn: 1,
      angle: 45,
      power: 300,
      wind: (Math.random() - 0.5) * 24,
      shell: null,
      turns: 0,
    }),
    stats: (s) => [
      s.turn === 1 ? "Gracz I" : "Gracz II",
      Math.ceil(s.tanks[0].hp),
      Math.ceil(s.tanks[1].hp),
    ],
    setup(Q, get) {
      for (const [id, label, min, max, value] of [
        ["angle", "Kąt", 10, 80, 45],
        ["power", "Siła", 180, 450, 300],
      ]) {
        const wrap = document.createElement("label"),
          input = document.createElement("input");
        wrap.textContent = label;
        input.type = "range";
        input.dataset.stateField = id;
        input.min = min;
        input.max = max;
        input.value = value;
        input.setAttribute("aria-label", label);
        input.oninput = () => {
          if (Q.H.active() && !get().shell) {
            get()[id] = Number(input.value);
            Q.H.render();
          }
        };
        wrap.append(input);
        Q.H.extra.append(wrap);
        if (id === "angle") angleInput = input;
        else powerInput = input;
      }
      Q.H.button("Ogień", () => fire(get(), Q), Q.H.extra);
      return { fire: () => fire(get(), Q), ground: (x) => ground(get(), x) };
    },
    space: fire,
    update(s, Q, dt) {
      if (!s.shell) return;
      const b = s.shell;
      b.vx += s.wind * dt;
      b.vy += 170 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.time += dt;
      if (b.x < 0 || b.x >= W || b.time > 8 || b.y >= ground(s, b.x)) {
        if (b.x >= 0 && b.x < W) {
          const y = ground(s, b.x);
          for (const t of s.tanks) {
            const d = Math.hypot(t.x - b.x, ground(s, t.x) - y);
            t.hp = Math.max(0, t.hp - Math.max(0, 70 - d) * 1.5);
          }
          for (
            let x = Math.max(0, Math.floor(b.x) - 35);
            x < Math.min(W, b.x + 35);
            x++
          ) {
            const depth = Math.sqrt(Math.max(0, 35 * 35 - (x - b.x) ** 2));
            s.terrain[x] = Math.min(
              455,
              Math.max(s.terrain[x], y + depth * 0.75),
            );
          }
        }
        s.shell = null;
        s.turns++;
        const dead = s.tanks.map((t) => t.hp <= 0);
        if (dead.some(Boolean)) {
          Q.H.finish(
            dead.every(Boolean)
              ? "Oba czołgi zniszczone. Remis."
              : `Wygrywa gracz ${dead[0] ? "II" : "I"}!`,
          );
          return;
        }
        if (s.turns >= 40) {
          Q.H.finish(
            s.tanks[0].hp === s.tanks[1].hp
              ? "Remis po 40 strzałach."
              : `Po 40 strzałach wygrywa gracz ${s.tanks[0].hp > s.tanks[1].hp ? "I" : "II"}.`,
          );
          return;
        }
        s.turn = 3 - s.turn;
        s.wind = (Math.random() - 0.5) * 24;
        Q.H.say(
          `Ruch gracza ${s.turn}. Wiatr: ${s.wind.toFixed(0)} (dodatni wieje w prawo).`,
        );
        Q.H.render();
      }
    },
    draw(s, Q, p) {
      const c = Q.ctx;
      c.fillStyle = p.green;
      c.beginPath();
      c.moveTo(0, T);
      s.terrain.forEach((y, x) => c.lineTo(x, y));
      c.lineTo(W, T);
      c.closePath();
      c.fill();
      s.tanks.forEach((t, k) => {
        const y = ground(s, t.x);
        c.fillStyle = k ? p.ink : p.accent;
        c.fillRect(t.x - 17, y - 13, 34, 13);
        const a = k
          ? Math.PI - (s.angle * Math.PI) / 180
          : (-s.angle * Math.PI) / 180;
        c.strokeStyle = k ? p.ink : p.accent;
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(t.x, y - 12);
        c.lineTo(t.x + Math.cos(a) * 25, y - 12 + Math.sin(a) * 25);
        c.stroke();
      });
      if (s.shell) S.circle(c, s.shell.x, s.shell.y, 4, p.gold);
      c.fillStyle = p.ink;
      c.font = "16px monospace";
      c.fillText(
        `Kąt ${s.angle}° · siła ${s.power} · wiatr ${s.wind.toFixed(0)}`,
        20,
        30,
      );
    },
    hint: "Pojedynek lokalny dla dwóch osób. Ustaw kąt i siłę, uwzględnij wiatr. Wybuch rzeźbi teren i uszkadza pancerz. Ruch przechodzi po zatrzymaniu pocisku.",
  });
})();
