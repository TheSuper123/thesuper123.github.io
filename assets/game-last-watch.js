/* Ostatnia warta: original character, encounters, dialogue and synthesised cues. */
(() => {
  "use strict";
  const R = SpinnerBossRules,
    H = SpinnerMore.create(["ENERGIA", "RDZEŃ", "SEKWENCJA"]);
  const $ = (id) => document.getElementById(id),
    canvas = $("game"),
    ctx = canvas.getContext("2d");
  // Logical physics coordinates remain stable; the backing bitmap is sharper.
  canvas.width = R.W * 2;
  canvas.height = R.H * 2;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  const keyboard = new Set(),
    pointers = new Map();
  let s,
    mode = "challenge",
    practice = 0,
    sound = false,
    audio,
    musicAt = 0,
    musicStep = 0;
  const modeSelect = H.select(
    "TRYB",
    [
      ["challenge", "Wyzwanie"],
      ["practice", "Trening"],
    ],
    (v) => {
      mode = v;
      practiceSelect.disabled = v !== "practice";
      newGame();
    },
  );
  const practiceSelect = H.select(
    "TRENING SEKWENCJI",
    R.waves.map((w, i) => [
      String(i),
      `${String(i + 1).padStart(2, "0")} · ${w.name}`,
    ]),
    (v) => {
      practice = Number(v);
      newGame();
    },
  );
  practiceSelect.disabled = true;
  const held = () => new Set([...keyboard, ...pointers.values()]);
  const clearInput = () => {
    keyboard.clear();
    pointers.clear();
    document
      .querySelectorAll("[data-bf-input]")
      .forEach((b) => b.removeAttribute("data-held"));
    if (s) s.player.jumpHeld = false;
  };
  function cue(kind) {
    if (!sound || !audio || audio.state !== "running") return;
    const tones = {
      warn: [174, 0.07, "sine"],
      beam: [520, 0.11, "triangle"],
      hit: [81, 0.14, "sawtooth"],
      strike: [349, 0.18, "triangle"],
      scan: [659, 0.12, "sine"],
      win: [440, 0.5, "sine"],
    };
    const [frequency, duration, type] = tones[kind] || tones.warn,
      t = audio.currentTime;
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, t);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 0.67,
      t + duration,
    );
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.035, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.02);
  }
  function score() {
    if (
      !sound ||
      !audio ||
      audio.state !== "running" ||
      !["warning", "defense"].includes(s.stage)
    )
      return;
    const now = audio.currentTime;
    if (musicAt < now) musicAt = now + 0.015;
    // Original five-beat mechanical ostinato; no samples or borrowed melodies.
    const motif = [0, 7, 3, 10, 5, 12, 8, 3, 7, 15];
    while (musicAt < now + 0.12) {
      const t = musicAt,
        step = musicStep++;
      const midi =
        42 + motif[step % motif.length] + (Math.floor(step / 20) % 2 ? 12 : 0);
      const oscillator = audio.createOscillator(),
        gain = audio.createGain();
      oscillator.type = step % 5 === 0 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(440 * 2 ** ((midi - 69) / 12), t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(
        step % 5 === 0 ? 0.025 : 0.012,
        t + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(t);
      oscillator.stop(t + 0.15);
      musicAt += Math.max(0.115, 0.16 - Math.min(s.turn, 11) * 0.003);
    }
  }
  $("bf-sound").onclick = async () => {
    try {
      if (!audio) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw Error();
        audio = new Audio();
      }
      sound = !sound;
      if (sound) await audio.resume();
      else await audio.suspend();
      musicAt = audio.currentTime + 0.02;
      $("bf-sound").textContent = sound ? "Dźwięk: wł." : "Dźwięk: wył.";
      $("bf-sound").setAttribute("aria-pressed", String(sound));
      cue("scan");
    } catch {
      sound = false;
      H.say(
        "Dźwięk jest niedostępny w tej przeglądarce. Wszystkie ostrzeżenia są też widoczne.",
      );
    }
  };
  const roundIndex = () => (s.turn < 12 ? s.turn : 9 + ((s.turn - 12) % 3));
  const wave = () => R.waves[roundIndex()];
  const focus = () => canvas.focus({ preventScroll: true });
  function recordText() {
    const best = SpinnerStorage.preferences.get("bossfight:best:v1", null);
    $("more-record").textContent =
      best &&
      Number.isFinite(best.ms) &&
      best.ms > 0 &&
      Number.isInteger(best.hits) &&
      best.hits >= 0
        ? `Rekord pełnego wyzwania: ${SpinnerNew.time(best.ms)} · trafienia: ${best.hits}. Trening ma osobne zasady.`
        : "Rekord dotyczy pełnego Wyzwania. Trwały zapis jest opcjonalny w ustawieniach prywatności.";
  }
  function newGame() {
    clearInput();
    audio?.suspend().catch(() => {});
    musicStep = 0;
    s = {
      stage: "intro",
      turn: mode === "practice" ? practice : 0,
      core: 144,
      hp: 64,
      heat: 0,
      hits: 0,
      repairs: 3,
      scans: 0,
      time: 0,
      clock: 0,
      warning: 1.25,
      shots: [],
      platforms: [],
      bounds: { x: 0, y: 0, w: R.W, h: R.H },
      mode: "free",
      flip: null,
      shrink: false,
      events: [],
      next: 0,
      invulnerable: 0,
      strikeAge: 0,
      player: {
        x: R.W / 2,
        y: R.H / 2,
        r: R.R,
        vx: 0,
        vy: 0,
        grounded: false,
        jumpHeld: false,
        jumpTime: 0,
        moving: false,
      },
    };
    H.reset();
    H.say("Rozpocznij próbę. W Opcjach możesz wybrać Trening.");
    $("bf-intro-note").textContent =
      mode === "practice"
        ? `Trening: ${wave().name}. Mniejsze obrażenia; wynik bez rekordu.`
        : "Trudna walka. Trening i wybór sekwencji są w Opcjach.";
    recordText();
    render();
  }
  function start() {
    if (!H.active() || s.stage !== "intro") return false;
    H.start();
    if (sound) audio?.resume().catch(() => {});
    beginWave();
    focus();
    return true;
  }
  function beginWave() {
    clearInput();
    s.stage = "warning";
    s.time = 0;
    s.warning = 1.25;
    s.shots = [];
    s.platforms = [];
    s.flip = null;
    s.mode = wave().mode;
    s.events = R.events(roundIndex());
    s.next = 0;
    s.shrink = false;
    s.bounds = { x: 0, y: 0, w: R.W, h: R.H };
    s.player = {
      x: s.mode === "left" ? R.R : s.mode === "right" ? R.W - R.R : R.W / 2,
      y: s.mode === "up" ? R.R : s.mode === "down" ? R.H - R.R : R.H / 2,
      r: R.R,
      vx: 0,
      vy: 0,
      grounded: s.mode !== "free",
      jumpHeld: false,
      jumpTime: 0,
      moving: false,
    };
    s.invulnerable = 0.6;
    H.say(wave().hint);
    cue("warn");
    render();
  }
  function finish(won, ending = "") {
    clearInput();
    s.stage = won ? "won" : "lost";
    s.shots = [];
    if (won && mode === "challenge") {
      const before = SpinnerStorage.preferences.get("bossfight:best:v1", null),
        ms = Math.max(1, Math.round(H.elapsed));
      if (
        !before ||
        !Number.isFinite(before.ms) ||
        before.ms <= 0 ||
        ms < before.ms
      )
        SpinnerStorage.preferences.set("bossfight:best:v1", {
          ms,
          hits: s.hits,
        });
    }
    const result = won
      ? ending === "release"
        ? "Protokół wyłączony. Nadzorca opuszcza skrzydła. Przejście jest twoje."
        : "Rdzeń wygaszony. Nadzorca oddaje przejście. Warta dobiegła końca."
      : `Próba przerwana: ${wave().name}. Przetrwano sekwencji: ${s.turn - (mode === "practice" ? practice : 0)}. Spróbuj ponownie albo przećwicz tę sekwencję w Opcjach.`;
    H.finish(result, won);
    $("bf-dialogue").textContent = won
      ? "Nie muszę już tu stać."
      : "Wróć, kiedy będziesz gotowy.";
    if (won) cue("win");
    recordText();
    render();
  }
  function choose(action) {
    if (!H.active() || s.stage !== "menu") return false;
    if (action === "release") {
      if (s.scans < 3 || s.turn < 11) return false;
      finish(true, "release");
      return true;
    }
    if (action === "strike") {
      s.stage = "timing";
      s.strikeAge = 0;
      H.say(
        "Zatrzymaj wskazówkę w pomarańczowym wycinku. Enter albo Wyślij impuls.",
      );
      render();
      $("bf-confirm").focus({ preventScroll: true });
      return true;
    }
    if (action === "heal") {
      if (s.hp >= 64 || s.repairs <= 0) return false;
      s.hp = Math.min(64, s.hp + 22);
      s.heat = 0;
      s.repairs--;
      cue("scan");
    } else if (action === "scan") {
      if (s.scans >= 3) return false;
      s.scans++;
      cue("scan");
    } else return false;
    s.turn++;
    beginWave();
    focus();
    return true;
  }
  const strikeAngle = () => Math.PI + s.strikeAge * 3.1;
  function confirmStrike(expired = false) {
    if (!H.active() || s.stage !== "timing") return false;
    const damage = expired ? 0 : R.strike(strikeAngle());
    s.core = Math.max(s.turn < 11 ? 1 : 0, s.core - damage);
    cue("strike");
    if (s.core === 0 && s.turn >= 11) {
      finish(true, "overload");
      return true;
    }
    s.turn++;
    beginWave();
    H.say(
      expired
        ? "Impuls wygasł. Przy następnej próbie użyj Enter lub przycisku."
        : `Impuls: ${damage} obrażeń. ${wave().hint}`,
    );
    focus();
    return true;
  }
  function addRect(x, y, w, h, args = {}) {
    s.shots.push({
      type: "rect",
      x,
      y,
      w,
      h,
      vx: 0,
      vy: 0,
      born: s.time,
      warn: 0,
      life: 20,
      rule: null,
      fired: false,
      ...args,
    });
  }
  function spawn(e) {
    const slow = mode === "practice" ? 0.78 : 1,
      t = s.time;
    if (e.type === "gate") {
      const x = e.side < 0 ? R.W + 30 : -30,
        vx = e.side * e.speed * slow,
        half = e.gap / 2;
      addRect(x, -20, 24, e.y - half + 20, { vx });
      addRect(x, e.y + half, 24, R.H - e.y - half + 20, { vx });
    } else if (e.type === "pillar") {
      if (e.wall === "down" || e.wall === "up")
        addRect(
          R.W + 25,
          e.wall === "down" ? R.H - e.height : 0,
          30,
          e.height,
          { vx: -212 * slow },
        );
      else
        addRect(e.wall === "right" ? R.W - e.height : 0, -30, e.height, 30, {
          vy: 158 * slow,
        });
    } else if (e.type === "ring") {
      const origins = [
          [0, 0],
          [R.W, R.H],
          [R.W, 0],
          [0, R.H],
        ],
        [x, y] = origins[e.corner],
        toward = Math.atan2(R.H / 2 - y, R.W / 2 - x);
      for (let i = 0; i < 13; i++) {
        const angle = toward - 1.25 + (i * 2.5) / 12;
        if (Math.abs(i - 6 - (e.corner % 2 ? 1 : -1)) <= 1) continue;
        s.shots.push({
          type: "orb",
          x: x + Math.cos(angle) * 24,
          y: y + Math.sin(angle) * 24,
          vx: Math.cos(angle) * (162 + e.angle * 7) * slow,
          vy: Math.sin(angle) * (162 + e.angle * 7) * slow,
          r: 6,
          born: t,
          warn: 0.45,
          life: 9,
          fired: false,
        });
      }
    } else if (e.type === "aim") {
      const p = s.player,
        a =
          e.axis === "x"
            ? { x: p.x, y: -20 }
            : e.axis === "y"
              ? { x: -20, y: p.y }
              : {
                  x: p.x - Math.cos(e.angle) * 900,
                  y: p.y - Math.sin(e.angle) * 900,
                };
      const b =
        e.axis === "x"
          ? { x: p.x, y: R.H + 20 }
          : e.axis === "y"
            ? { x: R.W + 20, y: p.y }
            : {
                x: p.x + Math.cos(e.angle) * 900,
                y: p.y + Math.sin(e.angle) * 900,
              };
      s.shots.push({
        type: "beam",
        a,
        b,
        width: 21,
        born: t,
        warn: mode === "practice" ? 1.15 : 0.86,
        life: 0.32,
        fired: false,
      });
      cue("warn");
    } else if (e.type === "pulse") {
      addRect(0, 0, R.W, R.H, { warn: 0.85, life: 0.65, rule: e.rule });
      cue("warn");
    } else if (e.type === "flip") {
      s.flip = { mode: e.mode, at: t + 0.9 };
      cue("warn");
    } else if (e.type === "platforms")
      s.platforms = [
        { x: 80, y: 300, w: 180, h: 9 },
        { x: 380, y: 240, w: 180, h: 9 },
      ];
    else if (e.type === "floor")
      addRect(0, 345, R.W, 55, { warn: 1.15, life: 1.1 });
    else if (e.type === "shrink") s.shrink = true;
  }
  function damage() {
    if (s.invulnerable > 0) return;
    const direct = mode === "practice" ? 2 : 4,
      heat = mode === "practice" ? 1 : 3;
    s.hp = Math.max(0, s.hp - direct);
    s.heat = Math.min(12, s.heat + heat);
    s.hits++;
    s.invulnerable = mode === "practice" ? 0.75 : 0.35;
    cue("hit");
    if (s.hp <= 0) finish(false);
  }
  function update(dt) {
    if (!s || H.phase !== "playing") return;
    s.clock += dt;
    if (s.stage === "timing") {
      s.strikeAge += dt;
      if (s.strikeAge >= 3.6) confirmStrike(true);
      return;
    }
    if (!["warning", "defense"].includes(s.stage)) return;
    s.invulnerable = Math.max(0, s.invulnerable - dt);
    if (s.stage === "warning") {
      R.move(s.player, held(), s.mode, dt, s.bounds, s.platforms);
      s.warning -= dt;
      if (s.warning <= 0) {
        s.stage = "defense";
        render();
      }
      return;
    }
    s.time += dt;
    if (s.shrink) {
      const k =
        R.clamp((s.time - 0.5) / 2, 0, 1) * R.clamp((9 - s.time) / 1.5, 0, 1);
      s.bounds = { x: 64 * k, y: 35 * k, w: R.W - 128 * k, h: R.H - 70 * k };
    }
    if (s.flip && s.time >= s.flip.at) {
      s.mode = s.flip.mode;
      s.flip = null;
      s.player.vx = s.player.vy = 0;
      s.player.grounded = false;
      s.player.jumpHeld = false;
      H.say(`${wave().hint} Przyciąganie: ${modeName(s.mode)}.`);
      render();
    }
    R.move(s.player, held(), s.mode, dt, s.bounds, s.platforms);
    while (s.next < s.events.length && s.events[s.next].t <= s.time)
      spawn(s.events[s.next++]);
    for (const shot of s.shots) {
      const active = s.time >= shot.born + shot.warn;
      if (active) {
        if (!shot.fired) {
          shot.fired = true;
          if (shot.type === "beam") cue("beam");
        }
        if (shot.vx) shot.x += shot.vx * dt;
        if (shot.vy) shot.y += shot.vy * dt;
      }
      if (R.collides(shot, s.player, s.player.moving, s.time)) {
        damage();
        if (s.stage === "lost") return;
      }
    }
    s.shots = s.shots.filter(
      (h) =>
        s.time < h.born + h.warn + h.life &&
        (h.x === undefined ||
          (h.x > -120 && h.x < R.W + 120 && h.y > -160 && h.y < R.H + 160)),
    );
    if (s.heat > 0) {
      const burn = Math.min(s.heat, 2.5 * dt);
      s.heat -= burn;
      s.hp = Math.max(0, s.hp - burn);
      if (s.hp <= 0) {
        finish(false);
        return;
      }
    }
    if (s.time >= wave().duration) {
      s.stage = "menu";
      s.shots = [];
      clearInput();
      H.say("Twoja kolej. 1: Impuls · 2: Naprawa · 3: Skan.");
      render();
      document
        .querySelector("#bf-choices [data-bf-action=strike]")
        .focus({ preventScroll: true });
    }
  }
  function modeName(value) {
    return {
      free: "swobodny ruch",
      down: "dół ↓",
      up: "góra ↑",
      left: "lewo ←",
      right: "prawo →",
    }[value];
  }
  function hud() {
    if (!s) return;
    H.stats([
      `${Math.ceil(s.hp)} / 64`,
      s.core,
      s.turn < 12
        ? `${String(s.turn + 1).padStart(2, "0")} / 12`
        : `+${s.turn - 11}`,
    ]);
    $("bf-health").value = s.hp;
    $("bf-core").value = s.core;
    $("bf-mode-label").textContent =
      mode === "practice" ? "TRENING" : "WYZWANIE";
    $("bf-heal-note").textContent = `+22 energii · ładunki: ${s.repairs}`;
    $("bf-scan-note").textContent = `Poznaj protokół · ${s.scans} / 3`;
    document.querySelector("#bf-choices [data-bf-action=heal]").disabled =
      s.repairs <= 0 || s.hp >= 64;
    document.querySelector("#bf-choices [data-bf-action=scan]").disabled =
      s.scans >= 3;
    document.querySelector("#bf-choices [data-bf-action=release]").hidden =
      s.scans < 3 || s.turn < 11;
    $("bf-needle").style.transform =
      `rotate(${(strikeAngle() * 180) / Math.PI}deg)`;
    const pulse = s.shots.find(
      (h) => h.rule && s.time >= h.born && s.time <= h.born + h.warn + h.life,
    );
    $("bf-rule").textContent = pulse
      ? `${pulse.rule === "still" ? "▧ STÓJ" : "⠿ RUSZAJ SIĘ"}${s.time < pulse.born + pulse.warn ? " · za chwilę" : " · teraz"}`
      : s.flip
        ? `PRZYCIĄGANIE → ${modeName(s.flip.mode)}`
        : s.stage === "warning"
          ? `${modeName(s.mode)} · przygotuj się`
          : s.mode !== "free"
            ? `PRZYCIĄGANIE: ${modeName(s.mode)}`
            : "";
    $("bf-rule").dataset.rule = pulse?.rule || "";
  }
  function render() {
    if (!s) return;
    $("bf-intro").hidden = s.stage !== "intro";
    $("bf-choices").hidden = s.stage !== "menu";
    $("bf-timing").hidden = s.stage !== "timing";
    $("board").dataset.stage = s.stage;
    $("board").dataset.tier = String(Math.min(3, 1 + Math.floor(s.turn / 4)));
    $("bf-wave-name").textContent =
      s.stage === "intro" ? "Ostatnia warta" : wave().name;
    if (!["won", "lost"].includes(s.stage))
      $("bf-dialogue").textContent = wave().line;
    const scans = [
      "",
      "Pierwszy skan: warta jest pętlą, nie rozkazem człowieka.",
      "Drugi skan: protokół ma dwanaście sekwencji kontrolnych.",
      "Trzeci skan: po dwunastej sekwencji możesz wyłączyć protokół.",
    ];
    $("bf-menu-note").textContent =
      s.scans === 3 && s.turn >= 11
        ? "Znasz cały protokół. Teraz zdecyduj: przeciążenie czy wyłączenie?"
        : scans[s.scans] ||
          "Masz czas na decyzję. Wybierz odpowiedź, zanim wrócisz na arenę.";
    $("bf-turn-label").textContent = `TWOJA KOLEJ / ${s.turn + 1}`;
    hud();
  }
  function draw() {
    if (!s) return;
    if (s.stage === "timing")
      $("bf-needle").style.transform =
        `rotate(${(strikeAngle() * 180) / Math.PI}deg)`;
    const p = SpinnerTheme.palette,
      b = s.bounds;
    ctx.clearRect(0, 0, R.W, R.H);
    ctx.fillStyle = p.paper;
    ctx.fillRect(0, 0, R.W, R.H);
    ctx.strokeStyle = p.grid;
    ctx.lineWidth = 0.7;
    for (let x = 0; x <= R.W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, R.H);
      ctx.stroke();
    }
    for (let y = 0; y <= R.H; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(R.W, y);
      ctx.stroke();
    }
    ctx.fillStyle = p.surface;
    ctx.fillRect(0, 0, R.W, b.y);
    ctx.fillRect(0, R.H - b.y, R.W, b.y);
    ctx.fillRect(0, b.y, b.x, b.h);
    ctx.fillRect(R.W - b.x, b.y, b.x, b.h);
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
    for (const platform of s.platforms) {
      ctx.fillStyle = p.green;
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.strokeStyle = p.paper;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(platform.x, platform.y + 4);
      ctx.lineTo(platform.x + platform.w, platform.y + 4);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const shot of s.shots) {
      const warning = s.time < shot.born + shot.warn;
      ctx.save();
      ctx.lineWidth = warning ? 2 : 3;
      ctx.strokeStyle = warning ? p.gold : p.red;
      ctx.fillStyle = warning ? p.gold : p.red;
      if (shot.type === "beam") {
        ctx.globalAlpha = warning ? 0.75 : 0.88;
        ctx.setLineDash(warning ? [9, 8] : []);
        ctx.lineWidth = warning ? 2 : shot.width;
        ctx.beginPath();
        ctx.moveTo(shot.a.x, shot.a.y);
        ctx.lineTo(shot.b.x, shot.b.y);
        ctx.stroke();
        if (!warning) {
          ctx.strokeStyle = p.paper;
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      } else if (shot.type === "orb") {
        ctx.globalAlpha = warning ? 0.3 : 1;
        ctx.translate(shot.x, shot.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-shot.r, -shot.r, shot.r * 2, shot.r * 2);
        ctx.strokeStyle = p.paper;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          -shot.r + 2,
          -shot.r + 2,
          shot.r * 2 - 4,
          shot.r * 2 - 4,
        );
      } else if (shot.rule) {
        ctx.globalAlpha = warning ? 0.1 : 0.22;
        ctx.fillStyle = shot.rule === "still" ? p.gold : p.blue;
        ctx.fillRect(0, 0, R.W, R.H);
        ctx.globalAlpha = warning ? 0.4 : 0.8;
        ctx.strokeStyle = ctx.fillStyle;
        if (shot.rule === "still")
          for (let x = -R.H; x < R.W; x += 36) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + R.H, R.H);
            ctx.stroke();
          }
        else
          for (let x = 12; x < R.W; x += 32)
            for (let y = 12; y < R.H; y += 32) {
              ctx.beginPath();
              ctx.arc(x, y, 2, 0, Math.PI * 2);
              ctx.fill();
            }
      } else {
        ctx.globalAlpha = warning ? 0.25 : 1;
        if (warning) {
          ctx.setLineDash([7, 7]);
          ctx.strokeRect(shot.x, shot.y, shot.w, shot.h);
        } else {
          ctx.fillRect(shot.x, shot.y, shot.w, shot.h);
          ctx.strokeStyle = p.paper;
          ctx.lineWidth = 2;
          for (let y = shot.y + 7; y < shot.y + shot.h; y += 18) {
            ctx.beginPath();
            ctx.moveTo(shot.x + 4, y);
            ctx.lineTo(shot.x + shot.w - 4, y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
    const player = s.player;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = s.invulnerable > 0 ? p.gold : p.blue;
    ctx.strokeStyle = p.paper;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -player.r - 3);
    ctx.lineTo(player.r + 3, 0);
    ctx.lineTo(0, player.r + 3);
    ctx.lineTo(-player.r - 3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = p.paper;
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
    if (s.heat > 0) {
      ctx.strokeStyle = p.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 17, 0, (Math.PI * 2 * s.heat) / 12);
      ctx.stroke();
    }
    if (s.stage === "warning") {
      ctx.fillStyle = p.overlay || p.paper;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(140, 155, 360, 78);
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.ink;
      ctx.textAlign = "center";
      ctx.font = "600 23px DM, sans-serif";
      ctx.fillText(wave().name, R.W / 2, 188);
      ctx.font = "13px Mono, monospace";
      ctx.fillStyle = p.muted;
      ctx.fillText(modeName(s.mode).toUpperCase(), R.W / 2, 213);
    }
  }
  function responsive() {
    const compact = innerWidth > innerHeight;
    $("board").dataset.aspect = compact ? "2.25" : "1.05";
    $("board").classList.toggle("bf-wide", compact);
    window.SpinnerViewport?.fit();
    H.render();
  }
  const bindings = {
    ArrowLeft: "left",
    a: "left",
    ArrowRight: "right",
    d: "right",
    ArrowUp: "up",
    w: "up",
    ArrowDown: "down",
    s: "down",
    " ": "jump",
    Shift: "slow",
  };
  document.addEventListener("keydown", (e) => {
    if (SpinnerNew.editing(e) || !H.active()) return;
    if (e.key === "Enter" && !e.repeat && !e.target.closest("button")) {
      if (s.stage === "intro") start();
      else if (s.stage === "timing") confirmStrike();
      else return;
      e.preventDefault();
      return;
    }
    if (s.stage === "menu" && /^[1-4]$/.test(e.key) && !e.repeat) {
      e.preventDefault();
      choose(["strike", "heal", "scan", "release"][Number(e.key) - 1]);
      return;
    }
    const action = bindings[e.key] || bindings[e.key.toLowerCase()];
    if (!action || !["warning", "defense"].includes(s.stage)) return;
    e.preventDefault();
    keyboard.add(action);
  });
  document.addEventListener("keyup", (e) => {
    const action = bindings[e.key] || bindings[e.key.toLowerCase()];
    if (action) {
      keyboard.delete(action);
      if (e.key === " ") e.preventDefault();
    }
  });
  for (const button of document.querySelectorAll("[data-bf-input]")) {
    button.addEventListener("pointerdown", (e) => {
      if (
        e.button !== 0 ||
        !H.active() ||
        !["warning", "defense"].includes(s.stage)
      )
        return;
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, button.dataset.bfInput);
      button.dataset.held = "true";
      focus();
    });
    const release = (e) => {
      pointers.delete(e.pointerId);
      if (![...pointers.values()].includes(button.dataset.bfInput))
        button.removeAttribute("data-held");
    };
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(name, release);
    button.addEventListener("keydown", (e) => {
      if (
        ["Enter", " "].includes(e.key) &&
        H.active() &&
        ["warning", "defense"].includes(s.stage)
      ) {
        e.preventDefault();
        keyboard.add(button.dataset.bfInput);
      }
    });
    button.addEventListener("keyup", (e) => {
      if (["Enter", " "].includes(e.key)) {
        e.preventDefault();
        keyboard.delete(button.dataset.bfInput);
      }
    });
  }
  $("bf-start").onclick = start;
  $("bf-confirm").onclick = () => confirmStrike();
  document
    .querySelectorAll("[data-bf-action]")
    .forEach((b) => (b.onclick = () => choose(b.dataset.bfAction)));
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = () => {
    hud();
    score();
  };
  H.onPause = () => {
    clearInput();
    if (H.phase === "paused") audio?.suspend().catch(() => {});
  };
  H.onResume = () => {
    clearInput();
    if (audio) musicAt = audio.currentTime + 0.02;
    if (sound) audio?.resume().catch(() => {});
    focus();
  };
  window.addEventListener("spinner:input-reset", clearInput);
  window.addEventListener("blur", clearInput);
  window.addEventListener("resize", responsive);
  window.addEventListener("spinner:preferences-cleared", recordText);
  const api = {
    start,
    choose,
    confirmStrike,
    newGame,
    getState: () => s,
    snapshot: () =>
      JSON.parse(
        JSON.stringify({
          ...s,
          phase: H.phase,
          elapsed: H.elapsed,
          difficulty: mode,
          input: [...held()],
        }),
      ),
    advance(seconds) {
      let remaining = R.clamp(Number(seconds) || 0, 0, 30);
      while (remaining > 0 && H.phase === "playing") {
        const dt = Math.min(remaining, 1 / 120);
        update(dt);
        remaining -= dt;
      }
      H.render();
    },
    rules: R,
  };
  window.BossFight = api;
  window.MoreGame = api;
  newGame();
  responsive();
  H.loop(update, draw);
})();
