/* Original attack schedules and deterministic, render-independent arena physics. */
(() => {
  "use strict";
  const W = 640,
    H = 400,
    R = 8;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const gravity = {
    free: [0, 0],
    down: [0, 1],
    up: [0, -1],
    left: [-1, 0],
    right: [1, 0],
  };
  const waves = [
    [
      "Kalibracja",
      "free",
      8.4,
      "Przeciskaj się przez przerwy w przesuwających się bramach.",
      "Zacznijmy od tego, czy umiesz zawrócić.",
    ],
    [
      "Celownik",
      "free",
      8.4,
      "Laser celuje w poprzednią pozycję. Opuść przerywaną linię.",
      "Nie stój tam, gdzie byłeś przed chwilą.",
    ],
    [
      "Ciężar",
      "down",
      8.8,
      "Skacz nad przesuwającymi się przeszkodami. Przytrzymaj skok.",
      "Ciężar to też kierunek.",
    ],
    [
      "Rezonans",
      "free",
      9,
      "Znajdź przerwy między wachlarzami pocisków.",
      "Ta wieża pamięta każdy sygnał.",
    ],
    [
      "Zmiana ściany",
      "right",
      9.5,
      "Teraz podłoga jest z prawej. Spacja skacze od każdej ściany.",
      "Przyzwyczajenia są twoim problemem.",
    ],
    [
      "Ruch / bezruch",
      "free",
      9.2,
      "▧ Kreski: stój. ⠿ Kropki: ruszaj się. Liczy się zmiana pozycji.",
      "Nawet cisza jest odpowiedzią.",
    ],
    [
      "Nad podłogą",
      "down",
      9.5,
      "Podłoga jest pod napięciem. Skocz na podesty.",
      "Nie wszystko, co pod tobą, jest oparciem.",
    ],
    [
      "Zacieśnienie",
      "free",
      9.4,
      "Arena się zwęża. Nie daj się zamknąć przy krawędzi.",
      "Mogę zabrać ci trochę miejsca.",
    ],
    [
      "Przekątne",
      "free",
      9.2,
      "Przekątne celują z opóźnieniem. Zmieniaj kierunek.",
      "Na proste odpowiedzi już za późno.",
    ],
    [
      "Odwrócenie",
      "up",
      9.6,
      "Sufit staje się podłogą. Potem przyciąga lewa ściana.",
      "Wciąż nazywasz to górą?",
    ],
    [
      "Dwa rozkazy",
      "free",
      10,
      "Przechodź przez bramy i czytaj regułę impulsów.",
      "Słyszysz już dwa sygnały naraz.",
    ],
    [
      "Rozszczelnienie",
      "free",
      11,
      "Ostatni protokół: lasery, wachlarze i dwie zmiany przyciągania.",
      "Jeśli przejdziesz, to będzie twój wybór.",
    ],
  ].map(([name, mode, duration, hint, line]) => ({
    name,
    mode,
    duration,
    hint,
    line,
  }));

  function events(index) {
    const out = [],
      add = (t, type, args = {}) => out.push({ t, type, ...args });
    const gate = (t, y, side = -1, speed = 174, gap = 118) =>
      add(t, "gate", { y, side, speed, gap });
    const aim = (t, axis = "x", angle = 0) => add(t, "aim", { axis, angle });
    const ring = (t, corner, angle = 0) => add(t, "ring", { corner, angle });
    const pillar = (t, wall = "down", height = 68) =>
      add(t, "pillar", { wall, height });
    const pulse = (t, rule) => add(t, "pulse", { rule });
    switch (index) {
      case 0:
        [110, 260, 165, 280, 120].forEach((y, i) => gate(0.25 + i * 1.5, y));
        break;
      case 1:
        for (let i = 0; i < 5; i++) aim(0.3 + i * 1.5, i % 2 ? "y" : "x");
        break;
      case 2:
        [48, 76, 94, 62].forEach((h, i) => pillar(0.25 + i * 1.7, "down", h));
        break;
      case 3:
        for (let i = 0; i < 5; i++) ring(0.2 + i * 1.6, i % 4, 0.3 + i * 0.47);
        break;
      case 4:
        [52, 82].forEach((h, i) => pillar(0.1 + i * 1.6, "right", h));
        add(4, "flip", { mode: "left" });
        [58, 86].forEach((h, i) => pillar(4.5 + i * 1.7, "left", h));
        break;
      case 5:
        for (let i = 0; i < 5; i++)
          pulse(0.15 + i * 1.75, i % 2 ? "move" : "still");
        break;
      case 6:
        add(0, "platforms");
        for (let i = 0; i < 3; i++) add(0.8 + i * 2.7, "floor");
        aim(4, "x");
        break;
      case 7:
        add(0.2, "shrink");
        [170, 250, 145].forEach((y, i) =>
          gate(1 + i * 2.2, y, i % 2 ? 1 : -1, 160, 126),
        );
        ring(5.2, 0, 0.3);
        break;
      case 8:
        for (let i = 0; i < 5; i++)
          aim(0.15 + i * 1.65, "diagonal", i % 2 ? 0.7 : -0.7);
        ring(3.8, 3, 2);
        break;
      case 9:
        [54, 86].forEach((h, i) => pillar(0.2 + i * 1.7, "up", h));
        add(4.2, "flip", { mode: "left" });
        [64, 90].forEach((h, i) => pillar(4.8 + i * 1.7, "left", h));
        break;
      case 10:
        gate(0.1, 95, -1, 175, 132);
        gate(3.2, 290, 1, 175, 132);
        gate(6.1, 180, -1, 175, 132);
        pulse(1.1, "move");
        pulse(4.5, "still");
        pulse(7.5, "move");
        break;
      case 11:
        aim(0.15, "x");
        ring(1.4, 0, 0.4);
        add(2.6, "flip", { mode: "down" });
        pillar(3.4, "down", 60);
        aim(4.1, "x");
        add(5.4, "flip", { mode: "right" });
        pillar(6.1, "right", 68);
        aim(7, "y");
        add(8.3, "flip", { mode: "free" });
        ring(8.7, 2, 1.4);
        break;
    }
    return out.sort((a, b) => a.t - b.t);
  }
  function circleRect(p, rect) {
    const x = clamp(p.x, rect.x, rect.x + rect.w),
      y = clamp(p.y, rect.y, rect.y + rect.h);
    return (p.x - x) ** 2 + (p.y - y) ** 2 < p.r ** 2;
  }
  function segmentDistance(p, a, b) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      den = dx * dx + dy * dy;
    const t = den
      ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / den, 0, 1)
      : 0;
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }
  function collides(h, p, moving, time) {
    if (time < h.born + h.warn || time > h.born + h.warn + h.life) return false;
    if ((h.rule === "still" && !moving) || (h.rule === "move" && moving))
      return false;
    if (h.type === "orb") return Math.hypot(h.x - p.x, h.y - p.y) < h.r + p.r;
    if (h.type === "beam")
      return segmentDistance(p, h.a, h.b) < p.r + h.width / 2;
    return circleRect(p, h);
  }
  function move(
    p,
    input,
    mode,
    dt,
    bounds = { x: 0, y: 0, w: W, h: H },
    platforms = [],
  ) {
    const oldX = p.x,
      oldY = p.y,
      [gx, gy] = gravity[mode];
    const dx = Number(input.has("right")) - Number(input.has("left"));
    const dy = Number(input.has("down")) - Number(input.has("up"));
    const jump =
      input.has("jump") ||
      (gx > 0 ? dx < 0 : gx < 0 ? dx > 0 : gy > 0 ? dy < 0 : dy > 0);
    if (mode === "free") {
      const length = Math.hypot(dx, dy) || 1,
        speed = input.has("slow") ? 98 : 238;
      p.x += (dx / length) * speed * dt;
      p.y += (dy / length) * speed * dt;
      p.vx = p.vy = 0;
      p.grounded = false;
    } else {
      const speed = input.has("slow") ? 122 : 228;
      if (gy) p.vx = dx * speed;
      else p.vy = dy * speed;
      if (jump && !p.jumpHeld && p.grounded) {
        p.vx -= gx * 414;
        p.vy -= gy * 414;
        p.grounded = false;
        p.jumpTime = 0.22;
      }
      const away = p.vx * gx + p.vy * gy < 0;
      const pull = jump && away && p.jumpTime > 0 ? 0.5 : 1;
      p.vx += gx * 980 * pull * dt;
      p.vy += gy * 980 * pull * dt;
      p.jumpTime = Math.max(0, (p.jumpTime || 0) - dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.grounded = false;
      if (mode === "down" && p.vy >= 0)
        for (const platform of platforms)
          if (
            oldY + p.r <= platform.y + 0.5 &&
            p.y + p.r >= platform.y &&
            p.x + p.r > platform.x &&
            p.x - p.r < platform.x + platform.w
          ) {
            p.y = platform.y - p.r;
            p.vy = 0;
            p.grounded = true;
          }
    }
    const x = clamp(p.x, bounds.x + p.r, bounds.x + bounds.w - p.r),
      y = clamp(p.y, bounds.y + p.r, bounds.y + bounds.h - p.r);
    if (p.x !== x) {
      if (gx && Math.sign(p.vx) === gx) p.grounded = true;
      p.vx = 0;
      p.x = x;
    }
    if (p.y !== y) {
      if (gy && Math.sign(p.vy) === gy) p.grounded = true;
      p.vy = 0;
      p.y = y;
    }
    // Exact boundary contact can be grounded without rounding through the wall.
    if (
      (gx > 0 && p.x >= bounds.x + bounds.w - p.r - 0.01) ||
      (gx < 0 && p.x <= bounds.x + p.r + 0.01) ||
      (gy > 0 && p.y >= bounds.y + bounds.h - p.r - 0.01) ||
      (gy < 0 && p.y <= bounds.y + p.r + 0.01)
    )
      p.grounded = true;
    p.jumpHeld = jump;
    p.moving = Math.hypot(p.x - oldX, p.y - oldY) > dt * 3;
    return p;
  }
  function strike(angle) {
    const error = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle)));
    return Math.round(6 + 8 * Math.max(0, 1 - error / 0.8));
  }
  window.SpinnerBossRules = Object.freeze({
    W,
    H,
    R,
    waves,
    events,
    clamp,
    gravity,
    collides,
    circleRect,
    segmentDistance,
    move,
    strike,
  });
})();
