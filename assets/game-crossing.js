(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["MIEJSCA", "PRÓBY", "CZAS"]),
    W = 600,
    T = 450,
    { canvas, ctx } = H.canvas(W, T);
  let s;
  const rowData = [
      { row: 7, speed: 75, kind: "car", width: 85, count: 3 },
      { row: 6, speed: -100, kind: "car", width: 95, count: 3 },
      { row: 5, speed: 88, kind: "car", width: 75, count: 3 },
      { row: 3, speed: 48, kind: "log", width: 160, count: 3 },
      { row: 2, speed: -62, kind: "log", width: 145, count: 3 },
      { row: 1, speed: 42, kind: "log", width: 170, count: 3 },
    ],
    goals = [125, 275, 475];
  function newGame() {
    s = {
      x: 275,
      row: 8,
      lives: 3,
      goals: [],
      time: 45,
      cooldown: 0,
      lanes: rowData.map((l, k) => ({
        ...l,
        objects: Array.from(
          { length: l.count },
          (_, i) => i * 250 - 100 + k * 38,
        ),
      })),
    };
    H.reset();
    H.say(
      "Zajmij trzy jasne pola po drugiej stronie. Belki płyną razem z Tobą.",
    );
    render();
  }
  function fail(message) {
    s.lives--;
    if (!s.lives) {
      H.finish(message + " Próby się skończyły.", false);
      return;
    }
    s.x = 275;
    s.row = 8;
    s.time = 45;
    s.cooldown = 0.2;
    H.say(message + ` Zostało prób: ${s.lives}.`);
  }
  function hop(dx, dy) {
    if (!H.active() || s.cooldown > 0) return false;
    H.start();
    s.x = S.clamp(s.x + dx * 50, 25, W - 25);
    s.row = S.clamp(s.row + dy, 0, 8);
    s.cooldown = 0.09;
    if (s.row === 0) {
      const index = goals.findIndex((x) => Math.abs(x - s.x) < 24);
      if (index < 0 || s.goals.includes(index))
        fail("To miejsce jest niedostępne.");
      else {
        s.goals.push(index);
        if (s.goals.length === 3) {
          H.record("crossing", s.lives);
          H.finish("Wszystkie trzy miejsca zajęte. Udana przeprawa!");
        } else {
          s.x = 275;
          s.row = 8;
          s.time = 45;
          H.say("Miejsce zajęte. Wybierz następne.");
        }
      }
    }
    render();
    return true;
  }
  function update(dt) {
    s.cooldown = Math.max(0, s.cooldown - dt);
    s.time -= dt;
    if (s.time <= 0) {
      fail("Czas przeprawy minął.");
      render();
      return;
    }
    for (const lane of s.lanes) {
      lane.objects = lane.objects.map((x) => {
        let v = x + lane.speed * dt;
        if (v > W + 50) v = -lane.width - 50;
        if (v < -lane.width - 50) v = W + 50;
        return v;
      });
      if (s.row !== lane.row) continue;
      const on = lane.objects.some(
        (x) => s.x + 11 > x && s.x - 11 < x + lane.width,
      );
      if (lane.kind === "car" && on) {
        fail("Spotkanie z ruchem ulicznym.");
        break;
      }
      if (lane.kind === "log") {
        const support = lane.objects.some(
          (x) => s.x > x && s.x < x + lane.width,
        );
        if (!support) {
          fail("Tu nie było belki.");
          break;
        }
        s.x += lane.speed * dt;
        if (s.x < 12 || s.x > W - 12) {
          fail("Belka odpłynęła za brzeg.");
          break;
        }
      }
    }
    render();
  }
  function draw() {
    if (!s) return;
    const p = S.backdrop(ctx, W, T);
    for (let row = 0; row < 9; row++) {
      ctx.fillStyle =
        row >= 5 && row <= 7 ? p.grid : row >= 1 && row <= 3 ? p.blue : p.green;
      ctx.globalAlpha = 0.26;
      ctx.fillRect(0, row * 50, W, 50);
      ctx.globalAlpha = 1;
    }
    goals.forEach((x, i) => {
      ctx.fillStyle = s.goals.includes(i) ? p.accent : p.surface;
      ctx.fillRect(x - 23, 5, 46, 40);
    });
    for (const lane of s.lanes)
      for (const x of lane.objects) {
        ctx.fillStyle = lane.kind === "log" ? p.gold : p.ink;
        ctx.fillRect(x, lane.row * 50 + 9, lane.width, 32);
        if (lane.kind === "car") {
          ctx.fillStyle = p.paper;
          ctx.fillRect(x + 18, lane.row * 50 + 13, 22, 24);
        }
      }
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(s.x, s.row * 50 + 25, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.ink;
    ctx.beginPath();
    ctx.arc(s.x - 5, s.row * 50 + 20, 2, 0, Math.PI * 2);
    ctx.arc(s.x + 5, s.row * 50 + 20, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  function render() {
    if (s)
      H.stats([`${s.goals.length} / 3`, s.lives, Math.ceil(s.time) + " s"]);
  }
  for (const [text, dx, dy] of [
    ["↑", 0, -1],
    ["←", -1, 0],
    ["↓", 0, 1],
    ["→", 1, 0],
  ]) {
    const b = H.button(text, () => {}, H.extra);
    b.onclick = null;
    S.press(b, () => hop(dx, dy), true);
    b.setAttribute(
      "aria-label",
      { "↑": "W górę", "←": "W lewo", "↓": "W dół", "→": "W prawo" }[text],
    );
  }
  H.keys((key, e) => {
    const d = {
      ArrowUp: [0, -1],
      w: [0, -1],
      ArrowDown: [0, 1],
      s: [0, 1],
      ArrowLeft: [-1, 0],
      a: [-1, 0],
      ArrowRight: [1, 0],
      d: [1, 0],
    }[key];
    if (d) {
      hop(...d);
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  S.api(
    H,
    {
      hop,
      update,
      advance: (dt) => S.advance(H, update, dt),
      getState: () => s,
      draw,
    },
    () => s,
  );
  newGame();
})();
