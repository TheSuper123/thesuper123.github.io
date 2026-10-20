(() => {
  "use strict";
  const canvas = document.querySelector("#game"),
    ctx = canvas.getContext("2d");
  const overlay = document.querySelector("#bird-overlay"),
    prefs = window.SpinnerStorage.preferences;
  const scoreElement = document.querySelector("#bird-score"),
    bestElement = document.querySelector("#bird-best");
  let bird,
    pipes,
    score,
    running = false,
    last = 0,
    spawn = 0,
    frame = null;
  let best = Number(prefs.get("bird:classic:best", 0)) || 0;
  bestElement.textContent = best;
  function draw() {
    ctx.fillStyle = SpinnerTheme.mode === "dark" ? "#1b2a20" : "#bfd0b3";
    ctx.fillRect(0, 0, 360, 500);
    ctx.fillStyle = SpinnerTheme.alpha("ink", 0.1);
    ctx.fillRect(30, 85, 48, 4);
    ctx.fillRect(54, 73, 42, 4);
    ctx.fillRect(245, 180, 58, 4);
    ctx.fillStyle = SpinnerTheme.palette.green;
    for (const pipe of pipes || []) {
      ctx.fillRect(pipe.x, 0, 48, pipe.y);
      ctx.fillRect(pipe.x, pipe.y + 150, 48, 500);
      ctx.fillStyle = SpinnerTheme.alpha("ink", 0.3);
      ctx.fillRect(pipe.x - 4, pipe.y - 15, 56, 15);
      ctx.fillRect(pipe.x - 4, pipe.y + 150, 56, 15);
      ctx.fillStyle = SpinnerTheme.palette.green;
    }
    if (!bird) return;
    ctx.save();
    ctx.translate(bird.x + 12, bird.y + 12);
    ctx.rotate(Math.max(-0.3, Math.min(0.6, bird.dy * 0.035)));
    ctx.fillStyle = "#efd18b";
    ctx.fillRect(-12, -12, 25, 25);
    ctx.fillStyle = "#b58345";
    ctx.fillRect(-15, -1, 15, 10);
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(4, -10, 10, 12);
    ctx.fillStyle = "#252720";
    ctx.fillRect(10, -7, 3, 5);
    ctx.fillStyle = "#cf6a40";
    ctx.fillRect(11, 4, 13, 7);
    ctx.restore();
  }
  function finish() {
    running = false;
    cancelAnimationFrame(frame);
    if (score > best) {
      best = score;
      prefs.set("bird:classic:best", best);
      bestElement.textContent = best;
    }
    document.querySelector("#bird-message").textContent =
      "Wynik: " + score + ". Jeszcze jedna próba?";
    document.querySelector("#bird-start").textContent = "Jeszcze raz ↻";
    overlay.hidden = false;
  }
  function tick(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 16.6667, 2);
    last = now;
    bird.dy += 0.4 * dt;
    bird.y += bird.dy * dt;
    spawn += dt;
    if (spawn > 100) {
      spawn = 0;
      pipes.push({ x: 360, y: 50 + Math.random() * 250, scored: false });
    }
    for (const pipe of pipes) {
      pipe.x -= 2.2 * dt;
      if (!pipe.scored && pipe.x + 48 < bird.x) {
        pipe.scored = true;
        score++;
        scoreElement.textContent = score;
      }
      if (
        bird.x + 24 > pipe.x &&
        bird.x < pipe.x + 48 &&
        (bird.y < pipe.y || bird.y + 24 > pipe.y + 150)
      ) {
        draw();
        finish();
        return;
      }
    }
    pipes = pipes.filter((pipe) => pipe.x > -60);
    draw();
    if (bird.y < 0 || bird.y + 24 > 500) {
      finish();
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(frame);
    bird = { x: 65, y: 230, dy: -5 };
    pipes = [];
    score = 0;
    spawn = 60;
    scoreElement.textContent = "0";
    overlay.hidden = true;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
    canvas.focus();
  }
  document.querySelector("#bird-start").onclick = start;
  canvas.tabIndex = 0;
  canvas.addEventListener("pointerdown", () => {
    if (running) bird.dy = -6.5;
  });
  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.target.closest("button,input,dialog"))
      return;
    event.preventDefault();
    if (running) bird.dy = -6.5;
    else start();
  });
  window.addEventListener("spinner:theme-change", draw);
  draw();
})();
