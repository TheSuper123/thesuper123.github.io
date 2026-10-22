(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["CZAS", "PUNKTY", "SERIA"]),
    W = 600,
    T = 480,
    { ctx } = H.canvas(W, T);
  let s,
    tempo = 500;
  H.select(
    "TEMPO",
    [
      [500, "Spokojne"],
      [360, "Szybkie"],
    ],
    (v) => {
      tempo = Number(v);
      newGame();
    },
  );
  H.button("Zacznij · Spacja", () => H.start(), H.controls, "ng-primary");
  function newGame() {
    s = {
      notes: Array.from(
        { length: Math.floor((28500 - 1500) / tempo) + 1 },
        (_, i) => ({
          at: 1500 + i * tempo,
          lane: (i * 3 + Math.floor(i / 4)) % 4,
          status: "pending",
        }),
      ),
      score: 0,
      combo: 0,
      best: 0,
      hits: 0,
      misses: 0,
      last: "Wybierz start i wypatruj linii.",
      lit: -1,
      litUntil: 0,
    };
    H.reset();
    H.say("D F J K odpowiadają czterem torom. Trafiaj na poziomej linii.");
    render();
  }
  function update() {
    for (const note of s.notes)
      if (note.status === "pending" && H.elapsed > note.at + 140) {
        note.status = "miss";
        s.misses++;
        s.combo = 0;
      }
    if (s.lit >= 0 && H.elapsed >= s.litUntil) s.lit = -1;
    if (H.elapsed >= 30000) {
      H.record("rhythm:" + tempo, s.score);
      H.finish(
        `Runda skończona. ${s.hits} trafień, ${s.misses} pominięć, wynik ${s.score}.`,
      );
    }
    render();
  }
  function hit(lane) {
    if (
      H.phase !== "playing" ||
      !Number.isInteger(lane) ||
      lane < 0 ||
      lane > 3
    )
      return false;
    update();
    if (H.phase !== "playing") return false;
    const note = s.notes
      .filter((n) => n.status === "pending" && n.lane === lane)
      .sort(
        (a, b) => Math.abs(a.at - H.elapsed) - Math.abs(b.at - H.elapsed),
      )[0];
    s.lit = lane;
    s.litUntil = H.elapsed + 120;
    if (note && Math.abs(note.at - H.elapsed) <= 140) {
      const exact = Math.abs(note.at - H.elapsed) <= 55;
      note.status = "hit";
      s.hits++;
      s.combo++;
      s.best = Math.max(s.best, s.combo);
      s.score += exact ? 100 : 50;
      s.last = exact ? "W punkt! +100" : "Trafione. +50";
    } else {
      s.combo = 0;
      s.score = Math.max(0, s.score - 10);
      s.last = "Poza rytmem. −10";
    }
    H.say(s.last);
    render();
    return true;
  }
  function draw() {
    if (!s) return;
    const p = S.backdrop(ctx, W, T);
    for (let lane = 0; lane < 4; lane++) {
      ctx.strokeStyle = p.grid;
      ctx.lineWidth = 2;
      ctx.strokeRect(40 + lane * 130, 10, 120, T - 20);
      if (s.lit === lane) {
        ctx.fillStyle = SpinnerTheme.alpha("accent", 0.2);
        ctx.fillRect(40 + lane * 130, 10, 120, T - 20);
      }
      ctx.fillStyle = p.ink;
      ctx.font = "26px Mono";
      ctx.textAlign = "center";
      ctx.fillText("DFJK"[lane], 100 + lane * 130, 440);
    }
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(35, 365);
    ctx.lineTo(565, 365);
    ctx.stroke();
    for (const n of s.notes)
      if (n.status === "pending") {
        const y = 365 - (n.at - H.elapsed) * 0.2;
        if (y > -20 && y < T) {
          ctx.fillStyle = p.green;
          ctx.fillRect(58 + n.lane * 130, y - 8, 84, 16);
        }
      }
  }
  function render() {
    if (s)
      H.stats([
        Math.max(0, 30 - Math.floor(H.elapsed / 1000)) + " s",
        s.score,
        s.combo,
      ]);
  }
  for (let i = 0; i < 4; i++) {
    const b = H.button("DFJK"[i], () => {}, H.extra);
    b.onclick = null;
    S.press(b, () => hit(i));
    b.style.minWidth = "52px";
  }
  H.keys((key, e) => {
    if (e.repeat) return false;
    const index = "dfjk".indexOf(key.toLowerCase());
    if (key.length === 1 && index >= 0) {
      hit(index);
      return true;
    }
    if (key === " ") {
      H.start();
      return true;
    }
  });
  H.onTick = update;
  H.onNew = newGame;
  H.onRender = render;
  H.loop(update, draw);
  S.api(H, { hit, update, draw }, () => s);
  newGame();
})();
