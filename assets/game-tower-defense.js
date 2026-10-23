(() => {
  "use strict";
  const S = SpinnerHundred,
    points = [
      [0, 240],
      [140, 240],
      [140, 100],
      [340, 100],
      [340, 370],
      [580, 370],
      [580, 240],
      [720, 240],
    ],
    plots = [
      [75, 175],
      [210, 170],
      [270, 45],
      [405, 180],
      [270, 300],
      [410, 300],
      [505, 435],
      [635, 315],
      [525, 180],
    ],
    types = [
      { name: "Strzały", cost: 50, damage: 12, range: 135, delay: 0.65 },
      { name: "Mróz", cost: 60, damage: 5, range: 125, delay: 0.75 },
      { name: "Działo", cost: 75, damage: 24, range: 140, delay: 1.4 },
    ];
  const lengths = points
      .slice(1)
      .map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1])),
    total = lengths.reduce((a, b) => a + b, 0);
  function position(distance) {
    for (let i = 0; i < lengths.length; i++) {
      if (distance <= lengths[i]) {
        const t = distance / lengths[i];
        return {
          x: points[i][0] + (points[i + 1][0] - points[i][0]) * t,
          y: points[i][1] + (points[i + 1][1] - points[i][1]) * t,
        };
      }
      distance -= lengths[i];
    }
    return { x: 720, y: 240 };
  }
  function build(s, Q, type) {
    if (
      !Q.H.active() ||
      !types[type] ||
      s.selected < 0 ||
      s.towers.some((t) => t.plot === s.selected)
    )
      return false;
    const def = types[type];
    if (s.gold < def.cost) {
      Q.H.say("Za mało monet na tę wieżę.");
      return false;
    }
    s.gold -= def.cost;
    s.towers.push({ plot: s.selected, type, level: 0, cooldown: 0 });
    Q.H.start();
    Q.H.say("Wieża gotowa. Możesz rozpocząć falę lub rozbudować obronę.");
    Q.H.render();
    return true;
  }
  function wave(s, Q) {
    if (!Q.H.active() || s.spawning || s.enemies.length || s.wave >= 5)
      return false;
    Q.H.start();
    s.wave++;
    s.remaining = 6 + s.wave * 2;
    s.spawning = true;
    s.spawn = 0;
    Q.H.say(`Fala ${s.wave}. Broń końca trasy.`);
    return true;
  }
  S.arcade({
    labels: ["FALA", "MONETY", "SERCA"],
    initial: () => ({
      wave: 0,
      gold: 150,
      lives: 10,
      towers: [],
      enemies: [],
      shots: [],
      selected: 0,
      remaining: 0,
      spawning: false,
      spawn: 0,
      kills: 0,
    }),
    stats: (s) => [s.wave + " / 5", s.gold, s.lives],
    setup(Q, get) {
      types.forEach((t, i) =>
        Q.H.button(`${t.name} ${t.cost}`, () => build(get(), Q, i), Q.H.extra),
      );
      Q.H.button(
        "Ulepsz",
        () => {
          const s = get(),
            t = s.towers.find((t) => t.plot === s.selected);
          if (Q.H.active() && t && t.level < 2 && s.gold >= 40 + t.level * 20) {
            s.gold -= 40 + t.level * 20;
            t.level++;
            Q.H.say("Większy zasięg i obrażenia.");
            Q.H.render();
          }
        },
        Q.H.extra,
      );
      Q.H.button("Następna fala", () => wave(get(), Q), Q.H.extra);
      Q.canvas.onpointerdown = (e) => {
        if (e.button || !Q.H.active()) return;
        const p = Q.point(e),
          k = plots.findIndex(([x, y]) => Math.hypot(p.x - x, p.y - y) < 32);
        if (k >= 0) {
          get().selected = k;
          Q.H.render();
        }
      };
      Q.H.keys((key, e) => {
        if (!e.repeat && /^[1-9]$/.test(key)) {
          get().selected = Number(key) - 1;
          Q.H.render();
          return true;
        }
      });
      return {
        build: (i) => build(get(), Q, i),
        wave: () => wave(get(), Q),
        position,
        total,
        plots,
        types,
      };
    },
    update(s, Q, dt) {
      s.shots = s.shots.filter((b) => (b.life -= dt) > 0);
      if (s.spawning) {
        s.spawn -= dt;
        if (s.spawn <= 0 && s.remaining > 0) {
          const hp = 24 + s.wave * 12;
          s.enemies.push({ distance: 0, hp, max: hp, slow: 0 });
          s.remaining--;
          s.spawn = 0.95;
        }
        if (!s.remaining) s.spawning = false;
      }
      for (const e of s.enemies) {
        e.slow = Math.max(0, e.slow - dt);
        e.distance += (34 + s.wave * 4) * (e.slow ? 0.52 : 1) * dt;
      }
      for (const t of s.towers) {
        t.cooldown -= dt;
        if (t.cooldown > 0) continue;
        const def = types[t.type],
          [x, y] = plots[t.plot],
          target = s.enemies
            .filter(
              (e) =>
                e.hp > 0 &&
                Math.hypot(
                  position(e.distance).x - x,
                  position(e.distance).y - y,
                ) <
                  def.range + t.level * 16,
            )
            .sort((a, b) => b.distance - a.distance)[0];
        if (!target) continue;
        const p = position(target.distance),
          damage = def.damage * (1 + t.level * 0.55);
        target.hp -= damage;
        if (t.type === 1) target.slow = 1.8;
        if (t.type === 2)
          for (const e of s.enemies)
            if (e !== target && Math.abs(e.distance - target.distance) < 45)
              e.hp -= damage * 0.6;
        t.cooldown = def.delay;
        s.shots.push({ x, y, to: p, life: 0.13, type: t.type });
      }
      for (const e of s.enemies)
        if (e.hp <= 0) {
          s.gold += 12 + s.wave;
          s.kills++;
        } else if (e.distance >= total) s.lives--;
      s.enemies = s.enemies.filter((e) => e.hp > 0 && e.distance < total);
      if (s.lives <= 0)
        Q.H.finish(
          `Obrona przerwana w fali ${s.wave}. Zatrzymano ${s.kills} przeciwników.`,
          false,
        );
      else if (s.wave === 5 && !s.spawning && !s.enemies.length)
        Q.H.finish(`Pięć fal odpartych. Pozostało ${s.lives} serc!`);
    },
    draw(s, Q, p) {
      const c = Q.ctx;
      c.strokeStyle = p.muted;
      c.lineWidth = 34;
      c.lineJoin = "round";
      c.beginPath();
      points.forEach(([x, y]) => c.lineTo(x, y));
      c.stroke();
      plots.forEach(([x, y], k) => {
        S.circle(c, x, y, 22, k === s.selected ? p.gold : p.grid);
        c.fillStyle = p.ink;
        c.font = "14px monospace";
        c.textAlign = "center";
        c.fillText(k + 1, x, y + 5);
      });
      for (const t of s.towers) {
        const [x, y] = plots[t.plot];
        S.circle(c, x, y, 18, [p.accent, p.blue, p.ink][t.type]);
        c.fillStyle = p.paper;
        c.font = "14px monospace";
        c.fillText(t.level + 1, x, y + 5);
      }
      for (const e of s.enemies) {
        const { x, y } = position(e.distance);
        S.circle(c, x, y, 10, e.slow ? p.blue : p.accent);
        c.fillStyle = p.ink;
        c.fillRect(x - 12, y - 18, (24 * e.hp) / e.max, 3);
      }
      for (const b of s.shots) {
        c.strokeStyle = [p.accent, p.blue, p.gold][b.type];
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(b.x, b.y);
        c.lineTo(b.to.x, b.to.y);
        c.stroke();
      }
      c.textAlign = "left";
    },
    hint: "Wybierz numer stanowiska na mapie lub klawiszem 1–9. Buduj wieże trzech typów, ulepszaj je i uruchamiaj fale. Trafienia dają monety; mróz spowalnia, działo trafia obszarowo. Pięć fal, dziesięć serc.",
  });
})();
