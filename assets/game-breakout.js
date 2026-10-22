(() => {
  "use strict";
  const { prefs, number, editing, pauses } = SpinnerNew,
    $ = (id) => document.getElementById(id),
    canvas = $("game"),
    ctx = canvas.getContext("2d");
  const W = 780,
    H = 520,
    STEP = 1 / 240,
    keys = new Set();
  let last = performance.now(),
    accumulator = 0,
    dirty = true;
  const game = {
    phase: "ready",
    score: 0,
    lives: 3,
    level: 1,
    mode: "normal",
    best: 0,
    paddle: { x: W / 2, y: H - 36, w: 112, h: 12 },
    ball: { x: W / 2, y: H - 55, vx: 0, vy: 0, r: 7 },
    bricks: [],
    particles: [],
    previous: "playing",
  };
  const speed = () =>
    (({ calm: 330, normal: 420, fast: 510 })[game.mode] || 420) *
    (1 + (game.level - 1) * 0.08);
  function say(text, result = "") {
    $("breakout-status").textContent = text;
    $("breakout-status").dataset.result = result;
  }
  function record() {
    if (game.score > game.best) {
      game.best = game.score;
      prefs.set("new:breakout:best:" + game.mode, game.best);
    }
  }
  function stats() {
    $("breakout-score").textContent = game.score;
    $("breakout-lives").textContent = game.lives;
    $("breakout-level").textContent = `${game.level} / 3`;
    $("breakout-record").textContent = `Rekord tego tempa: ${game.best}`;
    $("breakout-pause").disabled = ["won", "over", "between"].includes(
      game.phase,
    );
    $("breakout-pause").textContent =
      game.phase === "paused" ? "Wznów" : "Pauza";
    $("breakout-launch").disabled =
      game.phase === "playing" || game.phase === "paused";
    $("breakout-cover").hidden = game.phase === "playing";
    $("breakout-retry").hidden = !["over", "won"].includes(game.phase);
    const text = {
      ready: [
        "Piłka gotowa.",
        "Ustaw paletkę i podaj piłkę. Odbijaj ją różnymi częściami paletki.",
        "Podaj piłkę",
      ],
      paused: [
        "Piłka zaczeka.",
        "Runda zatrzymana. Wznów, gdy będziesz gotowy.",
        "Wznów",
      ],
      between: [
        "Ściana rozbita.",
        "Następna ma inny układ. Uważaj na mocniejsze cegły.",
        "Następna ściana",
      ],
      won: [
        "Trzy ściany za Tobą.",
        `Wynik: ${game.score}. Zostało piłek: ${game.lives}.`,
        "Jeszcze raz",
      ],
      over: [
        "Ostatnia piłka uciekła.",
        `Wynik: ${game.score}. Spróbujesz poprawić swój rekord?`,
        "Jeszcze raz",
      ],
    }[game.phase];
    if (text) {
      $("breakout-cover-title").textContent = text[0];
      $("breakout-cover-copy").textContent = text[1];
      $("breakout-start").textContent = text[2];
    }
  }
  function attachBall() {
    game.ball.x = game.paddle.x;
    game.ball.y = game.paddle.y - game.ball.r - 2;
    game.ball.vx = game.ball.vy = 0;
  }
  function makeWall() {
    game.bricks = [];
    const cols = 10,
      rows = 3 + game.level,
      gap = 7,
      width = 62,
      height = 21,
      left = (W - (cols * width + (cols - 1) * gap)) / 2;
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        if (
          (game.level === 2 && (row + col) % 5 === 0) ||
          (game.level === 3 && row === 2 && (col === 2 || col === 7))
        )
          continue;
        const hp = game.level === 3 && row < 2 ? 2 : 1;
        game.bricks.push({
          x: left + col * (width + gap),
          y: 55 + row * (height + gap),
          w: width,
          h: height,
          hp,
          max: hp,
          row,
        });
      }
    attachBall();
    game.particles = [];
    dirty = true;
  }
  function newGame() {
    game.mode = $("breakout-speed").value;
    if (!["calm", "normal", "fast"].includes(game.mode)) game.mode = "normal";
    game.phase = "ready";
    game.level = 1;
    game.score = 0;
    game.lives = 3;
    game.best = number(prefs.get("new:breakout:best:" + game.mode, 0));
    game.paddle.x = W / 2;
    game.paddle.w =
      game.mode === "calm" ? 130 : game.mode === "fast" ? 100 : 112;
    keys.clear();
    makeWall();
    accumulator = 0;
    last = performance.now();
    say("Masz trzy piłki na całą rundę.");
    stats();
    draw();
  }
  function aim(x) {
    if (!["ready", "playing"].includes(game.phase) || !Number.isFinite(x))
      return;
    game.paddle.x = Math.max(
      game.paddle.w / 2 + 4,
      Math.min(W - game.paddle.w / 2 - 4, x),
    );
    if (game.phase === "ready") attachBall();
    dirty = true;
  }
  function launch() {
    if (game.phase === "paused") {
      resume();
      return;
    }
    if (game.phase === "over" || game.phase === "won") newGame();
    if (game.phase === "between") {
      game.level++;
      makeWall();
      game.phase = "ready";
    }
    if (game.phase !== "ready") return;
    game.phase = "playing";
    const velocity = speed();
    game.ball.vx = velocity * 0.34 * (game.level % 2 ? 1 : -1);
    game.ball.vy = -Math.sqrt(
      velocity * velocity - game.ball.vx * game.ball.vx,
    );
    keys.clear();
    last = performance.now();
    accumulator = 0;
    say("Celuj miejscem odbicia od paletki.");
    stats();
    canvas.focus({ preventScroll: true });
    dirty = true;
  }
  function pause() {
    if (game.phase !== "playing") return;
    dragging = false;
    game.previous = game.phase;
    game.phase = "paused";
    keys.clear();
    accumulator = 0;
    stats();
    dirty = true;
    draw();
  }
  function resume() {
    if (game.phase !== "paused") return;
    game.phase = game.previous;
    keys.clear();
    accumulator = 0;
    last = performance.now();
    stats();
    canvas.focus({ preventScroll: true });
    dirty = true;
  }
  function update(dt) {
    if (!["playing", "ready"].includes(game.phase)) return;
    if (keys.has("left") !== keys.has("right"))
      aim(game.paddle.x + (keys.has("left") ? -1 : 1) * 560 * dt);
    if (game.phase === "ready") return;
    const ball = game.ball,
      previousX = ball.x,
      previousY = ball.y;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x < ball.r) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x > W - ball.r) {
      ball.x = W - ball.r;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y < ball.r) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
    }
    const pad = game.paddle;
    if (
      ball.vy > 0 &&
      ball.y + ball.r >= pad.y &&
      previousY + ball.r <= pad.y + 3 &&
      ball.x >= pad.x - pad.w / 2 - ball.r &&
      ball.x <= pad.x + pad.w / 2 + ball.r
    ) {
      const relative = Math.max(
          -1,
          Math.min(1, (ball.x - pad.x) / (pad.w / 2)),
        ),
        angle = relative * 1.05,
        velocity = speed();
      ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x));
      ball.y = pad.y - ball.r - 0.2;
      ball.vx = velocity * Math.sin(angle);
      ball.vy = -velocity * Math.cos(angle);
    }
    for (const brick of game.bricks) {
      if (
        !brick.hp ||
        ball.x + ball.r <= brick.x ||
        ball.x - ball.r >= brick.x + brick.w ||
        ball.y + ball.r <= brick.y ||
        ball.y - ball.r >= brick.y + brick.h
      )
        continue;
      const nearestX = Math.max(brick.x, Math.min(brick.x + brick.w, ball.x)),
        nearestY = Math.max(brick.y, Math.min(brick.y + brick.h, ball.y));
      if ((ball.x - nearestX) ** 2 + (ball.y - nearestY) ** 2 > ball.r ** 2)
        continue;
      if (previousY + ball.r <= brick.y) {
        ball.y = brick.y - ball.r - 0.1;
        ball.vy = -Math.abs(ball.vy);
      } else if (previousY - ball.r >= brick.y + brick.h) {
        ball.y = brick.y + brick.h + ball.r + 0.1;
        ball.vy = Math.abs(ball.vy);
      } else if (previousX + ball.r <= brick.x) {
        ball.x = brick.x - ball.r - 0.1;
        ball.vx = -Math.abs(ball.vx);
      } else if (previousX - ball.r >= brick.x + brick.w) {
        ball.x = brick.x + brick.w + ball.r + 0.1;
        ball.vx = Math.abs(ball.vx);
      } else {
        ball.vy = -ball.vy;
        ball.y =
          ball.vy < 0
            ? brick.y - ball.r - 0.1
            : brick.y + brick.h + ball.r + 0.1;
      }
      brick.hp--;
      game.score += brick.hp ? 5 : 10 * game.level;
      record();
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        for (let i = 0; i < 6; i++)
          game.particles.push({
            x: brick.x + brick.w / 2,
            y: brick.y + brick.h / 2,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 0.35,
          });
      stats();
      break;
    }
    game.particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    });
    game.particles = game.particles.filter((particle) => particle.life > 0);
    if (game.bricks.every((brick) => !brick.hp)) {
      game.phase = game.level === 3 ? "won" : "between";
      keys.clear();
      record();
      say(
        game.phase === "won"
          ? "Wszystkie trzy ściany rozbite!"
          : "Wybierz następny etap, gdy będziesz gotowy.",
        "win",
      );
      stats();
    } else if (ball.y - ball.r > H) {
      game.lives--;
      keys.clear();
      game.phase = game.lives ? "ready" : "over";
      attachBall();
      record();
      say(
        game.lives
          ? "Piłka uciekła. Kolejne podanie czeka na Ciebie."
          : "Runda zakończona.",
      );
      stats();
    }
    dirty = true;
  }
  function draw() {
    const p = SpinnerTheme.palette,
      dpr = Math.min(devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = p.board;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = SpinnerTheme.alpha("muted", 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 26; x < W; x += 52) {
      ctx.moveTo(x, 0.5);
      ctx.lineTo(x, H);
    }
    for (let y = 26; y < H; y += 52) {
      ctx.moveTo(0.5, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
    for (const brick of game.bricks) {
      if (!brick.hp) continue;
      ctx.fillStyle = [p.green, p.gold, p.accent, p.blue, p.violet, p.pink][
        brick.row % 6
      ];
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.strokeStyle = SpinnerTheme.alpha("ink", 0.5);
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.w - 1, brick.h - 1);
      if (brick.hp > 1) {
        ctx.strokeStyle = p.paper;
        ctx.beginPath();
        ctx.moveTo(brick.x + 8, brick.y + brick.h / 2);
        ctx.lineTo(brick.x + brick.w - 8, brick.y + brick.h / 2);
        ctx.stroke();
      }
    }
    for (const particle of game.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / 0.35);
      ctx.fillStyle = p.gold;
      ctx.fillRect(particle.x, particle.y, 3, 3);
    }
    ctx.globalAlpha = 1;
    const pad = game.paddle;
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.roundRect(pad.x - pad.w / 2, pad.y, pad.w, pad.h, 5);
    ctx.fill();
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = SpinnerTheme.alpha("paper", 0.65);
    ctx.fillRect(pad.x - 2, pad.y + 3, 4, 6);
    const ball = game.ball;
    ctx.fillStyle = p.ink;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.paper;
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.muted;
    ctx.font = "10px Mono";
    ctx.textAlign = "left";
    ctx.fillText("ODBIJ / ROZBIJ / JESZCZE RAZ", 22, H - 12);
    ctx.textAlign = "right";
    ctx.fillText(
      `${game.bricks.filter((brick) => brick.hp).length} CEGIEŁ`,
      W - 22,
      H - 12,
    );
    dirty = false;
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    dirty = true;
    draw();
  }
  function advance(elapsed) {
    if (game.phase === "playing" || game.phase === "ready") {
      accumulator += Math.min(0.08, Math.max(0, elapsed));
      while (accumulator + 1e-10 >= STEP) {
        update(STEP);
        accumulator -= STEP;
        if (!["ready", "playing"].includes(game.phase)) {
          accumulator = 0;
          break;
        }
      }
    } else accumulator = 0;
  }
  function frame(now) {
    const elapsed = Math.min(0.08, Math.max(0, (now - last) / 1000));
    last = now;
    advance(elapsed);
    if (dirty || game.phase === "playing") draw();
    requestAnimationFrame(frame);
  }
  const keyMap = {
    ArrowLeft: "left",
    ArrowRight: "right",
    a: "left",
    d: "right",
  };
  document.addEventListener("keydown", (event) => {
    if (editing(event)) return;
    const key = event.key.toLowerCase(),
      direction = keyMap[event.key] || keyMap[key];
    if (direction) {
      event.preventDefault();
      keys.add(direction);
    } else if (event.code === "Space") {
      event.preventDefault();
      if (!event.repeat) launch();
    } else if (key === "p" && !event.repeat) {
      event.preventDefault();
      game.phase === "paused" ? resume() : pause();
    }
  });
  document.addEventListener("keyup", (event) => {
    const direction = keyMap[event.key] || keyMap[event.key.toLowerCase()];
    if (direction) keys.delete(direction);
  });
  for (const direction of ["left", "right"]) {
    const button = $("breakout-" + direction);
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      keys.add(direction);
      aim(game.paddle.x + (direction === "left" ? -12 : 12));
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(name, () => keys.delete(direction));
    button.addEventListener("click", (event) => {
      if (event.detail === 0)
        aim(game.paddle.x + (direction === "left" ? -35 : 35));
    });
  }
  let dragging = false;
  const position = (event) => {
    const rect = canvas.getBoundingClientRect();
    aim(((event.clientX - rect.left) / rect.width) * W);
  };
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    position(event);
    if (game.phase === "ready") launch();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse" || dragging) position(event);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(name, () => (dragging = false));
  $("breakout-start").onclick = $("breakout-launch").onclick = launch;
  $("breakout-retry").onclick = $("breakout-new").onclick = newGame;
  $("breakout-speed").onchange = newGame;
  $("breakout-pause").onclick = () =>
    game.phase === "paused" ? resume() : pause();
  pauses(() => {
    keys.clear();
    dragging = false;
    pause();
  });
  window.addEventListener("resize", resize);
  window.addEventListener("spinner:preferences-cleared", () => {
    game.best = 0;
    stats();
  });
  window.SpinnerGame = {
    render: () => {
      dirty = true;
      draw();
    },
    pause,
  };
  window.BreakoutGame = {
    state: game,
    newGame,
    launch,
    aim,
    update,
    advance,
    draw,
    pause,
    snapshot: () => ({
      phase: game.phase,
      score: game.score,
      lives: game.lives,
      level: game.level,
      paddle: { ...game.paddle },
      ball: { ...game.ball },
      bricks: game.bricks.map((brick) => ({ ...brick })),
    }),
  };
  resize();
  newGame();
  requestAnimationFrame(frame);
})();
