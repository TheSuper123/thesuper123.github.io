(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["DYSTANS", "PALIWO", "OSŁONY"]),
    W = 600,
    T = 480,
    { ctx } = H.canvas(W, T);
  let s;
  const laneX = (i) => 150 + i * 150;
  function newGame() {
    s = {
      lane: 1,
      distance: 0,
      fuel: 100,
      lives: 3,
      objects: [],
      spawn: 0.6,
      fuelAt: 2,
      invincible: 0,
      road: 0,
    };
    H.reset();
    H.say("Zmień pas, zbieraj paliwo i dojedź do 3000 metrów.");
    render();
  }
  function change(direction) {
    if (!H.active()) return false;
    H.start();
    s.lane = S.clamp(s.lane + direction, 0, 2);
    H.render();
    return true;
  }
  function update(dt) {
    const speed = 90 + Math.min(30, s.distance * 0.01);
    s.distance += speed * dt;
    s.fuel = Math.max(0, s.fuel - 1.8 * dt);
    s.invincible = Math.max(0, s.invincible - dt);
    s.road = (s.road + speed * 3 * dt) % 80;
    s.spawn -= dt;
    s.fuelAt -= dt;
    if (s.spawn <= 0) {
      s.spawn = 0.8 + Math.random() * 0.4;
      s.objects.push({
        lane: Math.floor(Math.random() * 3),
        y: -60,
        kind: "car",
      });
    }
    if (s.fuelAt <= 0) {
      s.fuelAt = 2.4;
      s.objects.push({
        lane: Math.floor(Math.random() * 3),
        y: -35,
        kind: "fuel",
      });
    }
    for (let i = s.objects.length - 1; i >= 0; i--) {
      const o = s.objects[i];
      o.y += (250 + speed) * dt;
      if (
        o.lane === s.lane &&
        Math.abs(o.y - (T - 85)) < (o.kind === "fuel" ? 36 : 62)
      ) {
        if (o.kind === "fuel") {
          s.fuel = Math.min(100, s.fuel + 20);
          s.objects.splice(i, 1);
        } else if (!s.invincible) {
          s.lives--;
          s.invincible = 1.5;
          s.fuel = Math.max(0, s.fuel - 5);
          s.objects.splice(i, 1);
          if (!s.lives) {
            H.finish("Trzecie zderzenie kończy przejazd.", false);
            return;
          }
        }
      } else if (o.y > T + 90) s.objects.splice(i, 1);
    }
    if (!s.fuel)
      H.finish("Pusty bak. W następnej próbie zbieraj kanistry.", false);
    else if (s.distance >= 3000) {
      H.record("racer", s.lives * 100 + Math.round(s.fuel));
      H.finish(`Meta! Osłony: ${s.lives}, paliwo: ${Math.round(s.fuel)}%.`);
    }
    render();
  }
  function car(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - 25, y - 44, 50, 88);
    ctx.fillStyle = SpinnerTheme.palette.board;
    ctx.fillRect(x - 19, y - 27, 38, 22);
    ctx.fillRect(x - 19, y + 20, 38, 14);
    ctx.fillStyle = SpinnerTheme.palette.gold;
    ctx.fillRect(x - 22, y - 43, 8, 5);
    ctx.fillRect(x + 14, y - 43, 8, 5);
  }
  function draw() {
    if (!s) return;
    const p = S.backdrop(ctx, W, T);
    ctx.fillStyle = p.grid;
    ctx.fillRect(65, 0, 470, T);
    ctx.strokeStyle = p.muted;
    ctx.lineWidth = 3;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -s.road;
    for (const x of [225, 375]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, T);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const o of s.objects)
      if (o.kind === "car") car(laneX(o.lane), o.y, p.ink);
      else {
        ctx.fillStyle = p.gold;
        ctx.fillRect(laneX(o.lane) - 15, o.y - 18, 30, 36);
        ctx.fillStyle = p.board;
        ctx.font = "20px Mono";
        ctx.textAlign = "center";
        ctx.fillText("+", laneX(o.lane), o.y + 7);
      }
    ctx.globalAlpha = s.invincible ? 0.55 : 1;
    car(laneX(s.lane), T - 85, p.accent);
    ctx.globalAlpha = 1;
  }
  function render() {
    if (s)
      H.stats([
        Math.min(3000, Math.floor(s.distance)) + " m",
        Math.ceil(s.fuel) + "%",
        s.lives,
      ]);
  }
  for (const [text, dir] of [
    ["← Lewy pas", -1],
    ["Prawy pas →", 1],
  ]) {
    const b = H.button(text, () => {}, H.extra);
    b.onclick = null;
    S.press(b, () => change(dir));
  }
  H.button("Start", () => H.start(), H.controls, "ng-primary");
  H.keys((key, e) => {
    if (e.repeat) return false;
    if (["ArrowLeft", "a", "A"].includes(key)) {
      change(-1);
      return true;
    }
    if (["ArrowRight", "d", "D"].includes(key)) {
      change(1);
      return true;
    }
    if (key === " ") {
      H.start();
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  S.api(
    H,
    {
      change,
      update,
      advance: (dt) => S.advance(H, update, dt),
      getState: () => s,
      draw,
    },
    () => s,
  );
  newGame();
})();
