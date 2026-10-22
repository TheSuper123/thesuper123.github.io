(() => {
  "use strict";
  const H = SpinnerMore.create(["POZOSTAŁO", "PUNKTY", "SERIA"]);
  H.board.classList.add("mo-moles");
  let tempo = 900,
    target = -1,
    rock = -1,
    previous = -1,
    expires = 0,
    next = 0,
    score = 0,
    combo = 0,
    misses = 0,
    spawned = 0;
  H.select(
    "TEMPO",
    [
      [900, "Spokojne"],
      [600, "Szybkie"],
    ],
    (v) => {
      tempo = Number(v);
      newGame();
    },
  );
  const startButton = H.button(
    "Zacznij 30 sekund",
    begin,
    H.controls,
    "ng-primary",
  );
  const mole =
    '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M13 69V43a27 27 0 0 1 54 0v26" fill="currentColor"/><circle cx="30" cy="37" r="3" fill="var(--ink)"/><circle cx="50" cy="37" r="3" fill="var(--ink)"/><ellipse cx="40" cy="49" rx="11" ry="8" fill="var(--paper)"/><path d="m37 48 3 3 3-3" fill="var(--ink)"/></svg>';
  const stone =
    '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="m14 62 6-30 22-14 24 17 5 27-21 8Z" fill="currentColor"/><path d="m29 33 14 12 17-5" fill="none" stroke="var(--paper)" stroke-width="2"/></svg>';
  function newGame() {
    target = rock = previous = -1;
    expires = next = 0;
    score = combo = misses = spawned = 0;
    H.reset();
    H.record("moles:" + tempo);
    H.say(
      "Trafiaj krety, zostaw kamienie w spokoju. Przyciski 1–9 odpowiadają dołkom.",
    );
    render();
  }
  function begin() {
    if (H.phase !== "ready") return;
    H.start();
    spawn();
    H.say("Krety są pomarańczowe. Kamienie nie punktują.");
    render();
  }
  function spawn() {
    const choices = Array.from({ length: 9 }, (_, i) => i).filter(
      (i) => i !== previous,
    );
    target = choices[Math.floor(Math.random() * choices.length)];
    previous = target;
    rock = (target + 2 + Math.floor(Math.random() * 6)) % 9;
    expires = H.elapsed + tempo * 0.84;
    next = H.elapsed + tempo;
    spawned++;
    render();
  }
  function tick() {
    if (H.phase !== "playing") return;
    if (H.elapsed >= 30000) {
      target = rock = -1;
      H.record("moles:" + tempo, score);
      H.finish(`Koniec czasu: ${score} punktów, nietrafione krety: ${misses}.`);
      render();
      return;
    }
    if (target >= 0 && H.elapsed >= expires) {
      target = -1;
      combo = 0;
      misses++;
      render();
    }
    if (H.elapsed >= next) spawn();
    stats();
  }
  function hit(i) {
    if (H.phase !== "playing" || !Number.isInteger(i) || i < 0 || i > 8)
      return false;
    tick();
    if (H.phase !== "playing") return false;
    if (i === target) {
      combo++;
      const gain = 10 * Math.min(5, 1 + Math.floor((combo - 1) / 5));
      score += gain;
      target = -1;
      H.say(`+${gain}. Seria: ${combo}.`);
    } else {
      score = Math.max(0, score - 5);
      combo = 0;
      H.say(
        i === rock ? "Kamień. −5 punktów." : "Pusty dołek. −5 punktów.",
        "error",
      );
    }
    render();
    return true;
  }
  function stats() {
    H.stats([
      `${Math.max(0, Math.ceil((30000 - H.elapsed) / 1000))} s`,
      score,
      combo,
    ]);
  }
  function render() {
    H.grid(3, Array(9).fill(""), hit, (b, i) => {
      b.innerHTML =
        i === target
          ? mole
          : i === rock
            ? stone
            : `<span class="ng-edition">${i + 1}</span>`;
      b.dataset.rock = String(i === rock);
      b.setAttribute(
        "aria-label",
        `Dołek ${i + 1}: ${i === target ? "kret" : i === rock ? "kamień" : "pusty"}`,
      );
    });
    startButton.disabled = H.phase !== "ready";
    stats();
  }
  H.keys((key, e) => {
    if (/^[1-9]$/.test(key) && !e.repeat) {
      hit(Number(key) - 1);
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = tick;
  window.MoreGame = {
    newGame,
    begin,
    hit,
    tick,
    snapshot: () => ({
      target,
      rock,
      expires,
      next,
      score,
      combo,
      misses,
      spawned,
      elapsed: H.elapsed,
      phase: H.phase,
    }),
  };
  newGame();
})();
