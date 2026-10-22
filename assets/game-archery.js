(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["STRZAŁY", "PUNKTY", "WIATR"]),
    W = 720,
    T = 480,
    { canvas, ctx, point } = H.canvas(W, T);
  let s,
    dragging = false;
  const sliders = [];
  function slider(label, min, max, value, action) {
    const l = document.createElement("label"),
      input = document.createElement("input");
    l.className = "th-slider";
    l.textContent = label;
    input.type = "range";
    input.min = min;
    input.max = max;
    input.value = value;
    input.setAttribute("aria-label", label);
    input.oninput = () => {
      if (H.active()) {
        action(Number(input.value));
        H.render();
      }
    };
    l.append(input);
    H.extra.append(l);
    sliders.push(input);
    return input;
  }
  slider("KĄT", 15, 70, 45, (v) => (s.angle = v));
  slider("SIŁA", 300, 650, 570, (v) => (s.power = v));
  H.button("Strzel · Spacja", shoot, H.extra, "ng-primary");
  function newGame() {
    s = {
      angle: 45,
      power: 570,
      wind: Math.round((Math.random() - 0.5) * 40),
      shots: 0,
      score: 0,
      hits: 0,
      arrow: null,
      time: 0,
      targetY: 210,
    };
    dragging = false;
    H.reset();
    sliders[0].value = 45;
    sliders[1].value = 570;
    H.say("Ustaw kąt i siłę. Strzała opada, a tarcza porusza się.");
    render();
  }
  function shoot() {
    if (!H.active() || s.arrow || s.shots >= 10) return false;
    H.start();
    const angle = (s.angle * Math.PI) / 180;
    s.arrow = {
      x: 62,
      y: 370,
      vx: Math.cos(angle) * s.power,
      vy: -Math.sin(angle) * s.power,
    };
    s.shots++;
    render();
    return true;
  }
  function finishArrow(points) {
    s.score += points;
    if (points) s.hits++;
    s.arrow = null;
    H.say(points ? `Trafienie: ${points} pkt.` : "Strzała poza tarczą.");
    if (s.shots === 10) {
      H.record("archery", s.score);
      H.finish(`Dziesięć strzałów. Wynik: ${s.score}, trafienia: ${s.hits}.`);
    } else s.wind = Math.round((Math.random() - 0.5) * 40);
    render();
  }
  function update(dt) {
    s.time += dt;
    s.targetY = 210 + Math.sin(s.time * 0.8) * 95;
    if (!s.arrow) return;
    const a = s.arrow,
      oldX = a.x,
      oldY = a.y;
    a.vx += s.wind * 2.5 * dt;
    a.vy += 420 * dt;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (oldX < 660 && a.x >= 660) {
      const fraction = (660 - oldX) / (a.x - oldX),
        y = oldY + (a.y - oldY) * fraction,
        distance = Math.abs(y - s.targetY);
      finishArrow(
        distance <= 65 ? Math.max(1, Math.ceil(10 * (1 - distance / 65))) : 0,
      );
    } else if (a.y > T + 10 || a.x > W + 10 || a.x < 0) finishArrow(0);
  }
  function aim(e) {
    if (!H.active()) return;
    const p = point(e);
    s.angle = S.clamp(
      (Math.atan2(370 - p.y, p.x - 62) * 180) / Math.PI,
      15,
      70,
    );
    s.power = S.clamp(Math.hypot(p.x - 62, p.y - 370) * 1.1, 300, 650);
    sliders[0].value = s.angle;
    sliders[1].value = s.power;
    H.render();
  }
  canvas.onpointerdown = (e) => {
    if (e.button !== 0 || !e.isPrimary || !H.active()) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    dragging = true;
    aim(e);
  };
  canvas.onpointermove = (e) => {
    if (dragging) aim(e);
  };
  for (const n of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(n, () => (dragging = false));
  function draw() {
    if (!s) return;
    const p = S.backdrop(ctx, W, T);
    ctx.fillStyle = p.ink;
    ctx.fillRect(0, 420, W, 60);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = [p.paper, p.red, p.paper, p.blue, p.gold][i];
      ctx.beginPath();
      ctx.ellipse(660, s.targetY, 17 - i * 2, 65 - i * 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const angle = (s.angle * Math.PI) / 180;
    ctx.strokeStyle = p.green;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(55, 370, 30, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(62, 370);
    ctx.lineTo(62 + 50 * Math.cos(angle), 370 - 50 * Math.sin(angle));
    ctx.stroke();
    if (s.arrow) {
      const a = s.arrow,
        theta = Math.atan2(a.vy, a.vx);
      ctx.strokeStyle = p.ink;
      ctx.beginPath();
      ctx.moveTo(a.x - 18 * Math.cos(theta), a.y - 18 * Math.sin(theta));
      ctx.lineTo(a.x, a.y);
      ctx.stroke();
    }
    ctx.fillStyle = p.muted;
    ctx.font = "12px Mono";
    ctx.fillText(
      `KĄT ${Math.round(s.angle)}° · SIŁA ${Math.round(s.power)}`,
      20,
      28,
    );
  }
  function render() {
    if (s)
      H.stats([
        `${s.shots} / 10`,
        s.score,
        (s.wind >= 0 ? "→ " : "← ") + Math.abs(s.wind),
      ]);
  }
  H.keys((key, e) => {
    if (key === " " && !e.repeat) {
      shoot();
      return true;
    }
    const d = { ArrowUp: 1, ArrowDown: -1 }[key];
    if (d) {
      s.angle = S.clamp(s.angle + d, 15, 70);
      sliders[0].value = s.angle;
      H.render();
      return true;
    }
  });
  H.onPause = () => (dragging = false);
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  S.api(
    H,
    {
      shoot,
      update,
      advance: (dt) => S.advance(H, update, dt),
      getState: () => s,
      draw,
    },
    () => s,
  );
  newGame();
})();
