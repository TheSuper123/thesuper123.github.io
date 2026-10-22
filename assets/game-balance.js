(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["ZNACZNIKI", "POZOSTAŁO", "PRZECHYŁ"]),
    W = 720,
    T = 480,
    M = S.motion(H, W, T),
    { ctx, keys } = M,
    targets = [-100, 100, -170, 170, -60, 60, -205, 205];
  let s;
  M.bind("↶ W lewo", "left", ["ArrowLeft", "a", "A"]);
  H.button("Start · Spacja", () => H.start(), H.extra, "ng-primary");
  M.bind("W prawo ↷", "right", ["ArrowRight", "d", "D"]);
  function newGame() {
    s = { position: 0, velocity: 0, angle: 0, collected: 0 };
    keys.clear();
    H.reset();
    H.say(
      "Przechylaj delikatnie. Kulka ma bezwładność; zmień przechył przed celem.",
    );
    render();
  }
  function update(dt) {
    s.angle = S.clamp(
      s.angle +
        ((keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0)) * 0.6 * dt,
      -0.34,
      0.34,
    );
    s.velocity += 260 * Math.sin(s.angle) * dt;
    s.velocity *= Math.exp(-0.45 * dt);
    s.position += s.velocity * dt;
    if (Math.abs(s.position) > 260) {
      H.finish("Kulka spadła z końca belki.", false);
      render();
      return;
    }
    if (Math.abs(s.position - targets[s.collected]) < 16) {
      s.collected++;
      H.say("Znacznik złapany. Kolejny jest po drugiej stronie.");
      if (s.collected === 8) {
        H.record("balance", Math.round(H.elapsed), true, "ms");
        H.finish("Osiem znaczników. Równowaga opanowana!");
      }
    }
    if (H.active() && H.elapsed >= 60000)
      H.finish(`Minuta minęła. Zebrane znaczniki: ${s.collected} / 8.`, false);
    render();
  }
  function draw() {
    if (!s) return;
    const p = S.backdrop(ctx, W, T);
    ctx.fillStyle = p.muted;
    ctx.beginPath();
    ctx.moveTo(360, 290);
    ctx.lineTo(315, 390);
    ctx.lineTo(405, 390);
    ctx.fill();
    ctx.save();
    ctx.translate(360, 290);
    ctx.rotate(s.angle);
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-250, 0);
    ctx.lineTo(250, 0);
    ctx.stroke();
    ctx.lineCap = "butt";
    if (s.collected < 8) {
      ctx.strokeStyle = p.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(targets[s.collected], -18, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(s.position, -18, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = p.muted;
    ctx.font = "13px Mono";
    ctx.textAlign = "center";
    ctx.fillText("ZŁOTY OKRĄG TO NASTĘPNY CEL", W / 2, 55);
  }
  function render() {
    if (s)
      H.stats([
        `${s.collected} / 8`,
        Math.max(0, 60 - Math.floor(H.elapsed / 1000)) + " s",
        Math.round((s.angle * 180) / Math.PI) + "°",
      ]);
  }
  H.keys((key, e) => {
    if (key === " " && !e.repeat) {
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
      update,
      targets,
      advance: (dt) => S.advance(H, update, dt),
      getState: () => s,
      draw,
    },
    () => s,
  );
  newGame();
})();
