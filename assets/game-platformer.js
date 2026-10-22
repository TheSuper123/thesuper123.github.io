(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["ETAP", "KLUCZE", "PRÓBY"]),
    W = 720,
    T = 480,
    M = S.motion(H, W, T),
    { ctx, keys } = M;
  let s;
  const levels = [
    {
      platforms: [
        [170, 350, 100, 14],
        [350, 290, 110, 14],
        [540, 345, 100, 14],
      ],
      keys: [
        [220, 323],
        [400, 263],
      ],
      spikes: [[300, 60]],
    },
    {
      platforms: [
        [120, 360, 110, 14],
        [270, 290, 105, 14],
        [430, 230, 110, 14],
      ],
      keys: [
        [175, 333],
        [320, 263],
        [485, 203],
      ],
      spikes: [
        [245, 60],
        [560, 50],
      ],
    },
    {
      platforms: [
        [90, 350, 90, 14],
        [240, 275, 90, 14],
        [390, 205, 90, 14],
        [545, 285, 105, 14],
      ],
      keys: [
        [135, 323],
        [285, 248],
        [435, 178],
        [600, 258],
      ],
      spikes: [
        [190, 45],
        [350, 45],
        [500, 40],
      ],
    },
  ];
  M.bind("← Bieg", "left", ["ArrowLeft", "a", "A"]);
  const jumpButton = H.button("Skok ↑", () => {}, H.extra, "ng-primary");
  jumpButton.onclick = null;
  S.press(jumpButton, jump);
  M.bind("Bieg →", "right", ["ArrowRight", "d", "D"]);
  function load() {
    const level = levels[s.level - 1];
    s.player = { x: 40, y: 408, vx: 0, vy: 0, grounded: true };
    s.keys = level.keys.map(([x, y]) => ({ x, y, collected: false }));
    s.buffer = 0;
    s.coyote = 0.1;
    H.say("Zbierz wszystkie klucze i wejdź do drzwi po prawej.");
  }
  function newGame() {
    s = { level: 1, lives: 3, player: {}, keys: [], buffer: 0, coyote: 0 };
    keys.clear();
    load();
    H.reset();
    render();
  }
  function jump() {
    if (!H.active()) return false;
    H.start();
    s.buffer = 0.14;
    return true;
  }
  function fail() {
    s.lives--;
    if (!s.lives) {
      H.finish("Trzecia próba się skończyła. Etapy czekają na rewanż.", false);
      return;
    }
    s.player = { x: 40, y: 408, vx: 0, vy: 0, grounded: true };
    s.buffer = 0;
    s.coyote = 0.1;
    H.say(`Wracasz na początek etapu. Próby: ${s.lives}.`);
  }
  function update(dt) {
    const p = s.player,
      level = levels[s.level - 1];
    s.buffer = Math.max(0, s.buffer - dt);
    s.coyote = p.grounded ? 0.1 : Math.max(0, s.coyote - dt);
    if (s.buffer > 0 && s.coyote > 0) {
      p.vy = -475;
      p.grounded = false;
      s.buffer = s.coyote = 0;
    }
    p.vx = ((keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0)) * 235;
    p.x = S.clamp(p.x + p.vx * dt, 0, W - 24);
    const oldBottom = p.y + 32;
    p.vy += 1050 * dt;
    p.y += p.vy * dt;
    p.grounded = false;
    for (const [x, y, w, h] of [[0, 440, 720, 40], ...level.platforms])
      if (
        p.vy >= 0 &&
        oldBottom <= y + 0.5 &&
        p.y + 32 >= y &&
        p.x + 24 > x &&
        p.x < x + w
      ) {
        p.y = y - 32;
        p.vy = 0;
        p.grounded = true;
      }
    if (
      level.spikes.some(
        ([x, w]) => p.x + 21 > x && p.x + 3 < x + w && p.y + 32 > 426,
      ) ||
      p.y > T
    ) {
      fail();
      render();
      return;
    }
    for (const k of s.keys)
      if (!k.collected && Math.hypot(p.x + 12 - k.x, p.y + 16 - k.y) < 25)
        k.collected = true;
    if (p.x + 24 > 660 && p.y + 32 > 390 && s.keys.every((k) => k.collected)) {
      if (s.level === 3) {
        H.record("platformer", s.lives);
        H.finish("Trzy etapy, wszystkie klucze. Drzwi stoją otworem!");
      } else {
        s.level++;
        load();
      }
    }
    render();
  }
  function draw() {
    if (!s) return;
    const colors = S.backdrop(ctx, W, T),
      level = levels[s.level - 1];
    ctx.fillStyle = colors.ink;
    ctx.fillRect(0, 440, W, 40);
    for (const [x, y, w, h] of level.platforms) ctx.fillRect(x, y, w, h);
    ctx.fillStyle = colors.red;
    for (const [x, w] of level.spikes)
      for (let k = 0; k < w; k += 15) {
        ctx.beginPath();
        ctx.moveTo(x + k, 440);
        ctx.lineTo(x + k + 7, 424);
        ctx.lineTo(x + k + 15, 440);
        ctx.fill();
      }
    ctx.fillStyle = s.keys.every((k) => k.collected)
      ? colors.green
      : colors.muted;
    ctx.fillRect(660, 386, 35, 54);
    for (const k of s.keys)
      if (!k.collected) {
        ctx.strokeStyle = colors.gold;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(k.x, k.y, 7, 0, Math.PI * 2);
        ctx.moveTo(k.x + 7, k.y);
        ctx.lineTo(k.x + 18, k.y);
        ctx.lineTo(k.x + 18, k.y + 5);
        ctx.stroke();
      }
    ctx.fillStyle = colors.accent;
    ctx.fillRect(s.player.x, s.player.y, 24, 32);
    ctx.fillStyle = colors.paper;
    ctx.fillRect(s.player.x + 15, s.player.y + 7, 4, 4);
  }
  function render() {
    if (s)
      H.stats([
        `${s.level} / 3`,
        s.keys.filter((k) => k.collected).length + " / " + s.keys.length,
        s.lives,
      ]);
  }
  H.keys((key, e) => {
    if (["ArrowUp", "w", "W", " "].includes(key) && !e.repeat) {
      jump();
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  S.api(
    H,
    {
      jump,
      update,
      levels,
      advance: (dt) => S.advance(H, update, dt),
      getState: () => s,
      draw,
    },
    () => s,
  );
  newGame();
})();
