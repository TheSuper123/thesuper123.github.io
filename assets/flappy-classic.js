(() => {
  "use strict";
  const canvas = document.getElementById("game"),
    ctx = canvas.getContext("2d"),
    prefs = SpinnerStorage.preferences;
  const overlay = document.getElementById("bird-overlay"),
    scoreElement = document.getElementById("bird-score"),
    bestElement = document.getElementById("bird-best");
  const configurations = {
    calm: { speed: 115, gap: 188, spacing: 226 },
    classic: { speed: 140, gap: 170, spacing: 222 },
    quick: { speed: 165, gap: 152, spacing: 218 },
  };
  const width = 360,
    height = 500,
    ground = 474,
    radius = 9,
    fixedStep = 1 / 120;
  let bird = { x: 82, y: 235, vy: 0 },
    pipes = [],
    score = 0,
    feathers = 0,
    phase = "ready",
    mode = "classic",
    frame = 0,
    last = 0,
    accumulator = 0,
    elapsed = 0,
    distance = 0,
    gateCount = 0,
    lastFlap = -1000,
    trail = [],
    particles = [];
  let nextCenter = 238,
    lastDistanceLabel = -1;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function bestKey() {
    return mode === "classic"
      ? "bird:classic:best"
      : "bird:classic:best:" + mode;
  }
  function readBest() {
    const value = Number(prefs.get(bestKey(), 0));
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }
  let best = readBest();
  bestElement.textContent = best;
  function retainBest() {
    if (score > best) {
      best = score;
      prefs.set(bestKey(), best);
      bestElement.textContent = best;
    }
  }
  function updateHUD() {
    scoreElement.textContent = score;
    document.getElementById("bird-feathers").textContent = feathers;
  }
  function spawnGate(x) {
    const config = configurations[mode],
      gap = Math.max(
        config.gap - 18,
        config.gap - Math.floor(gateCount / 4) * 2,
      );
    const minCenter = 64 + gap / 2,
      maxCenter = ground - 50 - gap / 2;
    nextCenter = Math.max(
      minCenter,
      Math.min(
        maxCenter,
        nextCenter + (Math.random() - 0.5) * (gateCount ? 138 : 50),
      ),
    );
    gateCount++;
    pipes.push({
      x,
      top: nextCenter - gap / 2,
      gap,
      scored: false,
      feather: gateCount % 3 === 0,
      collected: false,
      index: gateCount,
    });
  }
  function circleRect(cx, cy, r, x, y, w, h) {
    const dx = cx - Math.max(x, Math.min(cx, x + w)),
      dy = cy - Math.max(y, Math.min(cy, y + h));
    return dx * dx + dy * dy < r * r;
  }
  function finish() {
    if (phase !== "running") return;
    phase = "over";
    cancelAnimationFrame(frame);
    retainBest();
    updateHUD();
    document.getElementById("bird-title").textContent = "Jeszcze jeden lot?";
    document.getElementById("bird-message").textContent =
      `Wynik: ${score}. Pióra: ${feathers}. Dystans: ${Math.floor(distance / 12)} m.`;
    document.getElementById("bird-start").textContent = "Jeszcze raz ↻";
    document.getElementById("bird-start").hidden = false;
    document.getElementById("bird-resume").hidden = true;
    document.getElementById("bird-mode-label").hidden = false;
    document.getElementById("bird-pause").disabled = true;
    document.getElementById("bird-flap").disabled = true;
    document.getElementById("bird-distance").textContent = "Lot zakończony";
    overlay.hidden = false;
    draw();
  }
  function simulate(dt) {
    const config = configurations[mode],
      speed = config.speed * Math.min(1.16, 1 + gateCount * 0.005);
    elapsed += dt;
    distance += speed * dt;
    bird.vy = Math.min(590, bird.vy + 1060 * dt);
    bird.y += bird.vy * dt;
    if (bird.y - radius < 4 || bird.y + radius > ground) {
      finish();
      return;
    }
    for (const pipe of pipes) {
      pipe.x -= speed * dt;
      if (
        circleRect(bird.x, bird.y, radius, pipe.x, 0, 48, pipe.top) ||
        circleRect(bird.x, bird.y, radius, pipe.x - 4, pipe.top - 13, 56, 13) ||
        circleRect(
          bird.x,
          bird.y,
          radius,
          pipe.x,
          pipe.top + pipe.gap,
          48,
          ground - pipe.top - pipe.gap,
        ) ||
        circleRect(
          bird.x,
          bird.y,
          radius,
          pipe.x - 4,
          pipe.top + pipe.gap,
          56,
          13,
        )
      ) {
        finish();
        return;
      }
      if (
        pipe.feather &&
        !pipe.collected &&
        Math.hypot(bird.x - pipe.x - 24, bird.y - pipe.top - pipe.gap / 2) < 21
      ) {
        pipe.collected = true;
        score += 2;
        feathers++;
        updateHUD();
        retainBest();
        if (!reduced)
          for (let i = 0; i < 9; i++)
            particles.push({
              x: bird.x,
              y: bird.y,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 140,
              born: elapsed,
            });
      }
      if (!pipe.scored && pipe.x + 52 < bird.x - radius) {
        pipe.scored = true;
        score++;
        updateHUD();
        retainBest();
      }
    }
    pipes = pipes.filter((pipe) => pipe.x > -70);
    if (!pipes.length || pipes.at(-1).x < width - config.spacing)
      spawnGate(pipes.length ? pipes.at(-1).x + config.spacing : width + 45);
    const meters = Math.floor(distance / 12);
    if (meters !== lastDistanceLabel) {
      lastDistanceLabel = meters;
      document.getElementById("bird-distance").textContent =
        meters +
        " m · " +
        (mode === "calm"
          ? "spokojnie"
          : mode === "quick"
            ? "szybko"
            : "klasycznie");
    }
  }
  function tick(now) {
    if (phase !== "running") return;
    accumulator += Math.min((now - last) / 1000, 0.1);
    last = now;
    while (accumulator >= fixedStep && phase === "running") {
      accumulator -= fixedStep;
      simulate(fixedStep);
    }
    if (!reduced) {
      trail.push({ x: bird.x - 7, y: bird.y, born: elapsed });
      trail = trail.filter((p) => elapsed - p.born < 0.18);
    }
    draw();
    if (phase === "running") frame = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(frame);
    mode = document.getElementById("bird-difficulty").value;
    best = readBest();
    bestElement.textContent = best;
    bird = { x: 82, y: 235, vy: -320 };
    pipes = [];
    score = 0;
    feathers = 0;
    elapsed = 0;
    distance = 0;
    gateCount = 0;
    nextCenter = 238;
    trail = [];
    particles = [];
    lastDistanceLabel = -1;
    lastFlap = 0;
    accumulator = 0;
    spawnGate(width + 55);
    phase = "running";
    updateHUD();
    overlay.hidden = true;
    document.getElementById("bird-mode-label").hidden = true;
    document.getElementById("bird-pause").disabled = false;
    document.getElementById("bird-pause").textContent = "Pauza · P";
    document.getElementById("bird-flap").disabled = false;
    last = performance.now();
    frame = requestAnimationFrame(tick);
    canvas.focus({ preventScroll: true });
    draw();
  }
  function flap() {
    if (phase !== "running") return;
    bird.vy = -320;
    lastFlap = elapsed;
    canvas.focus({ preventScroll: true });
    draw();
  }
  function pause() {
    if (phase !== "running") return;
    phase = "paused";
    cancelAnimationFrame(frame);
    document.getElementById("bird-title").textContent = "Zawiśnij na chwilę.";
    document.getElementById("bird-message").textContent =
      "Lot zatrzymany. Wznów, kiedy będziesz gotowy.";
    document.getElementById("bird-start").hidden = true;
    document.getElementById("bird-resume").hidden = false;
    document.getElementById("bird-mode-label").hidden = true;
    document.getElementById("bird-pause").textContent = "Wznów · P";
    document.getElementById("bird-flap").disabled = true;
    document.getElementById("bird-distance").textContent = "Pauza";
    overlay.hidden = false;
    draw();
  }
  function resume() {
    if (phase !== "paused") return;
    phase = "running";
    overlay.hidden = true;
    document.getElementById("bird-pause").textContent = "Pauza · P";
    document.getElementById("bird-flap").disabled = false;
    last = performance.now();
    frame = requestAnimationFrame(tick);
    canvas.focus({ preventScroll: true });
  }
  function togglePause() {
    phase === "paused" ? resume() : pause();
  }
  function draw() {
    const p = SpinnerTheme.palette,
      dark = SpinnerTheme.mode === "dark";
    ctx.fillStyle = dark ? "#17251d" : "#dce3ca";
    ctx.fillRect(0, 0, width, height);
    // Distant hills and ink clouds move at different speeds. All shapes are original.
    ctx.fillStyle = SpinnerTheme.alpha("green", 0.12);
    ctx.beginPath();
    ctx.moveTo(0, ground);
    for (let x = -20; x <= width + 20; x += 12)
      ctx.lineTo(x, ground - 88 - Math.sin((x + distance * 0.16) / 95) * 34);
    ctx.lineTo(width, ground);
    ctx.fill();
    ctx.strokeStyle = SpinnerTheme.alpha("ink", 0.12);
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const x = ((((i * 119 - distance * 0.08) % 480) + 480) % 480) - 60,
        y = 72 + (i % 3) * 52;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 38, y);
      ctx.moveTo(x + 12, y - 8);
      ctx.lineTo(x + 48, y - 8);
      ctx.stroke();
    }
    ctx.fillStyle = SpinnerTheme.alpha("green", 0.17);
    for (let i = 0; i < 7; i++) {
      const x = ((((i * 83 - distance * 0.32) % 581) + 581) % 581) - 60;
      ctx.beginPath();
      ctx.ellipse(x, ground, 34, 50 + (i % 3) * 17, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    for (const pipe of pipes) {
      ctx.fillStyle = p.green;
      ctx.fillRect(pipe.x, 0, 48, pipe.top);
      ctx.fillRect(
        pipe.x,
        pipe.top + pipe.gap,
        48,
        ground - pipe.top - pipe.gap,
      );
      ctx.fillStyle = SpinnerTheme.alpha("paper", 0.13);
      ctx.fillRect(pipe.x + 7, 0, 6, pipe.top - 12);
      ctx.fillRect(
        pipe.x + 7,
        pipe.top + pipe.gap + 13,
        6,
        ground - pipe.top - pipe.gap,
      );
      ctx.fillStyle = p.ink;
      ctx.fillRect(pipe.x - 4, pipe.top - 13, 56, 13);
      ctx.fillRect(pipe.x - 4, pipe.top + pipe.gap, 56, 13);
      ctx.fillStyle = SpinnerTheme.alpha("paper", 0.24);
      ctx.fillRect(pipe.x - 2, pipe.top - 11, 52, 2);
      ctx.fillRect(pipe.x - 2, pipe.top + pipe.gap + 2, 52, 2);
      if (pipe.feather && !pipe.collected) {
        const x = pipe.x + 24,
          y = pipe.top + pipe.gap / 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.3);
        ctx.fillStyle = p.gold;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.paper;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 11);
        ctx.moveTo(0, 1);
        ctx.lineTo(4, -3);
        ctx.stroke();
        ctx.restore();
      }
    }
    if (!reduced) {
      ctx.strokeStyle = SpinnerTheme.alpha("gold", 0.35);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (const item of trail) {
        const life = 1 - (elapsed - item.born) / 0.18;
        ctx.globalAlpha = Math.max(0, life);
        ctx.beginPath();
        ctx.moveTo(item.x - (elapsed - item.born) * 110, item.y);
        ctx.lineTo(item.x - (elapsed - item.born) * 110 - 5, item.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.max(-0.4, Math.min(0.75, bird.vy * 0.0016)));
    const wing = !reduced && elapsed - lastFlap < 0.15 ? -10 : 3;
    ctx.fillStyle = dark ? "#f0cd88" : "#dbad57";
    ctx.beginPath();
    ctx.moveTo(-14, 3);
    ctx.lineTo(-7, -10);
    ctx.lineTo(8, -9);
    ctx.lineTo(15, 2);
    ctx.lineTo(6, 12);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.gold;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-18, wing);
    ctx.lineTo(-7, 8);
    ctx.lineTo(3, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.moveTo(12, -1);
    ctx.lineTo(23, 3);
    ctx.lineTo(12, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.paper;
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.ink;
    ctx.beginPath();
    ctx.arc(8, -4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = p.board;
    ctx.fillRect(0, ground, width, height - ground);
    ctx.strokeStyle = p.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ground + 0.5);
    ctx.lineTo(width, ground + 0.5);
    ctx.stroke();
    ctx.strokeStyle = p.green;
    for (let i = 0; i < 28; i++) {
      const x = ((((i * 19 - distance) % 532) + 532) % 532) - 15;
      ctx.beginPath();
      ctx.moveTo(x, ground + 19);
      ctx.lineTo(x + 5, ground + 12);
      ctx.stroke();
    }
    particles = particles.filter((item) => elapsed - item.born < 0.45);
    for (const item of particles) {
      const age = elapsed - item.born;
      ctx.fillStyle = SpinnerTheme.alpha("gold", 1 - age / 0.45);
      ctx.fillRect(item.x + item.vx * age, item.y + item.vy * age, 3, 3);
    }
  }
  document.getElementById("bird-start").addEventListener("click", start);
  document.getElementById("bird-resume").addEventListener("click", resume);
  document.getElementById("bird-pause").addEventListener("click", togglePause);
  function pointerFlap(event) {
    event.preventDefault();
    flap();
  }
  canvas.addEventListener("pointerdown", pointerFlap);
  const flapButton = document.getElementById("bird-flap");
  flapButton.addEventListener("pointerdown", pointerFlap);
  flapButton.addEventListener("click", (event) => {
    if (event.detail === 0) flap();
  });
  document.getElementById("bird-difficulty").addEventListener("change", () => {
    if (phase === "running" || phase === "paused") return;
    mode = document.getElementById("bird-difficulty").value;
    best = readBest();
    bestElement.textContent = best;
  });
  document.addEventListener("keydown", (event) => {
    if (event.target.closest("input,select,textarea,dialog")) return;
    if (event.code === "Space" && !event.target.closest("button")) {
      event.preventDefault();
      if (event.repeat) return;
      if (phase === "running") flap();
      else if (phase === "ready" || phase === "over") start();
      return;
    }
    if ((event.code === "KeyP" || event.code === "Escape") && !event.repeat) {
      event.preventDefault();
      togglePause();
    }
    if (event.code === "KeyR" && !event.repeat) {
      event.preventDefault();
      start();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.addEventListener("blur", pause);
  window.addEventListener("spinner:theme-change", draw);
  window.addEventListener("spinner:pause", pause);
  window.addEventListener("spinner:preferences-cleared", () => {
    best = 0;
    bestElement.textContent = "0";
  });
  window.SpinnerGame = {
    render: draw,
    pause,
    get state() {
      return {
        phase,
        mode,
        score,
        feathers,
        distance,
        bird: { ...bird },
        pipes: pipes.map((p) => ({ ...p })),
        elapsed,
      };
    },
  };
  draw();
})();
