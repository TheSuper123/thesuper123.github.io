(() => {
  "use strict";
  const S = SpinnerHundred;
  function cast(s, Q) {
    if (!Q.H.active() || s.mode !== "idle") return false;
    Q.H.start();
    s.mode = "waiting";
    s.time = 0;
    s.biteAt = 1.5 + Math.random() * 3;
    s.message = "Czekaj na wyraźne branie.";
    Q.H.say(s.message);
    return true;
  }
  function hook(s, Q) {
    if (!Q.H.active()) return false;
    if (s.mode === "idle") return cast(s, Q);
    if (s.mode !== "bite") {
      if (s.mode === "waiting")
        Q.H.say("Jeszcze nie bierze. Obserwuj spławik.");
      return false;
    }
    s.mode = "fight";
    s.distance = 100;
    s.tension = 35;
    s.stamina = 100;
    s.time = 0;
    Q.H.say(
      "Ryba na haczyku. Przytrzymuj kołowrotek, ale luzuj przy szarpnięciu.",
    );
    return true;
  }
  function fail(s, Q, message) {
    s.misses++;
    s.mode = "idle";
    Q.H.say(message);
    if (s.misses === 3)
      Q.H.finish(
        `${s.caught} złowionych ryb. Trzy ucieczki kończą wyprawę.`,
        false,
      );
    else Q.H.render();
  }
  S.arcade({
    labels: ["RYBY", "UCIECZKI", "NAPIĘCIE"],
    binds: [["Zwijaj", "reel", ["ArrowUp", "w", "W"]]],
    initial: () => ({
      mode: "idle",
      time: 0,
      biteAt: 0,
      distance: 100,
      tension: 0,
      stamina: 100,
      caught: 0,
      misses: 0,
    }),
    stats: (s) => [
      s.caught + " / 5",
      s.misses + " / 3",
      Math.round(s.tension) + "%",
    ],
    setup(Q, get) {
      Q.H.button("Zarzuć / zatnij", () => hook(get(), Q), Q.H.extra);
      return { cast: () => cast(get(), Q), hook: () => hook(get(), Q) };
    },
    space: hook,
    update(s, Q, dt) {
      s.time += dt;
      if (s.mode === "waiting" && s.time >= s.biteAt) {
        s.mode = "bite";
        s.time = 0;
        Q.H.say("BRANIE! Zatnij teraz.");
        Q.H.render();
      } else if (s.mode === "bite" && s.time > 1.3)
        fail(s, Q, "Ryba puściła przynętę. Zarzuć jeszcze raz.");
      else if (s.mode === "fight") {
        const pulling = Math.sin(s.time * 2.1) > 0.45,
          reel = Q.keys.has("reel");
        s.tension = S.clamp(
          s.tension + (reel ? (pulling ? 48 : 12) : -35) * dt,
          0,
          110,
        );
        s.stamina = Math.max(0, s.stamina - (reel && !pulling ? 9 : 2) * dt);
        s.distance +=
          (reel
            ? -(pulling ? 1 : 7) * (1 + (100 - s.stamina) / 100)
            : pulling
              ? 5
              : 1) * dt;
        s.distance = S.clamp(s.distance, 0, 130);
        if (s.tension >= 100)
          fail(s, Q, "Żyłka pękła. Luzuj podczas mocnego szarpnięcia.");
        else if (s.distance >= 130) fail(s, Q, "Ryba odpłynęła za daleko.");
        else if (s.distance <= 0) {
          s.caught++;
          s.mode = "idle";
          s.tension = 0;
          if (s.caught === 5) Q.H.finish("Pięć ryb złowionych. Udana wyprawa!");
          else {
            Q.H.say("Ryba przy brzegu! Możesz zarzucić ponownie.");
            Q.H.render();
          }
        }
      }
    },
    draw(s, Q, p) {
      const c = Q.ctx;
      c.fillStyle = p.blue;
      c.fillRect(0, 160, 720, 320);
      c.fillStyle = p.green;
      c.fillRect(0, 125, 100, 355);
      c.strokeStyle = p.ink;
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(40, 175);
      c.lineTo(170, 70);
      c.stroke();
      const x = s.mode === "fight" ? 120 + s.distance * 4 : 480,
        y =
          s.mode === "bite"
            ? 200 + Math.sin(s.time * 25) * 12
            : 185 + Math.sin(s.time * 2) * 4;
      c.strokeStyle = p.gold;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(170, 70);
      c.lineTo(x, y);
      c.stroke();
      S.circle(c, x, y, 7, s.mode === "bite" ? p.accent : p.paper);
      if (s.mode === "fight") {
        c.fillStyle = p.gold;
        c.beginPath();
        c.ellipse(x, 285, 25, 12, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = p.paper;
        c.fillRect(170, 35, 360, 18);
        c.fillStyle = s.tension > 75 ? p.accent : p.green;
        c.fillRect(170, 35, 360 * Math.min(1, s.tension / 100), 18);
        c.fillStyle = p.ink;
        c.font = "18px monospace";
        c.fillText(
          Math.sin(s.time * 2.1) > 0.45
            ? "SZARPNIĘCIE — LUZUJ"
            : "SPOKOJNIE — ZWIJAJ",
          180,
          100,
        );
      } else {
        c.fillStyle = p.ink;
        c.font = "20px monospace";
        c.fillText(
          s.mode === "idle"
            ? "Zarzuć wędkę"
            : s.mode === "bite"
              ? "BRANIE! ZATNIJ!"
              : "Czekaj na branie…",
          230,
          80,
        );
      }
    },
    hint: "Zarzuć, zaczekaj na branie i zatnij w ciągu 1,3 sekundy. Potem zwijaj, luzując podczas szarpnięć. Zbyt duże napięcie zrywa żyłkę. Złów pięć ryb przed trzecią ucieczką.",
  });
})();
