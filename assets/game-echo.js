(() => {
  "use strict";
  const H = SpinnerMore.create(["POZIOM", "ODTWORZONE", "REKORD"]);
  H.board.classList.add("mo-echo");
  let sequence = [],
    cursor = 0,
    stage = "await",
    lit = -1,
    showAt = 0,
    until = 0,
    speed = 0.48,
    completed = 0;
  H.select(
    "POKAZ",
    [
      [0.48, "Spokojny"],
      [0.27, "Szybki"],
    ],
    (v) => {
      speed = Number(v);
      newGame();
    },
  );
  const startButton = H.button(
    "Pokaż sekwencję",
    begin,
    H.controls,
    "ng-primary",
  );
  function newGame() {
    sequence = [];
    cursor = 0;
    stage = "await";
    lit = -1;
    showAt = until = 0;
    completed = 0;
    H.reset();
    H.record("echo");
    H.say("Uruchom pokaz. Potem powtórz kolejność pól.");
    render();
  }
  function begin() {
    if (!H.active() || stage !== "await") return;
    H.start();
    next();
  }
  function next() {
    sequence.push(Math.floor(Math.random() * 4));
    cursor = 0;
    stage = "show";
    lit = -1;
    showAt = H.elapsed + 250;
    H.say("Obserwuj. Teraz gra pokazuje kolejność.");
    render();
  }
  function press(i) {
    if (
      !H.active() ||
      stage !== "input" ||
      !Number.isInteger(i) ||
      i < 0 ||
      i > 3
    )
      return false;
    if (i !== sequence[cursor]) {
      stage = "end";
      lit = -1;
      H.record("echo", completed);
      H.finish(
        `Tym razem inna kolejność. Ukończone serie: ${completed}.`,
        false,
      );
      render();
      return true;
    }
    cursor++;
    lit = i;
    until = H.elapsed + 140;
    if (cursor === sequence.length) {
      completed = sequence.length;
      H.record("echo", completed);
      if (completed === 15) {
        stage = "end";
        H.finish("Piętnaście serii bez pomyłki. Doskonała pamięć!");
      } else {
        stage = "rest";
        until = H.elapsed + 700;
        H.say("Zgadza się. Za chwilę dojdzie jeszcze jeden znak.");
      }
    } else H.say(`Dobrze: ${cursor} z ${sequence.length}.`);
    render();
    return true;
  }
  function tick() {
    let changed = false;
    if (stage === "show") {
      const elapsed = (H.elapsed - showAt) / 1000,
        step = speed + 0.16,
        index = Math.floor(elapsed / step);
      if (index >= sequence.length) {
        stage = "input";
        lit = -1;
        H.say("Twoja kolej. Powtórz całą sekwencję.");
        changed = true;
      } else {
        const value =
          elapsed >= 0 && elapsed % step < speed ? sequence[index] : -1;
        if (value !== lit) {
          lit = value;
          changed = true;
        }
      }
    } else if (stage === "rest" && H.elapsed >= until) {
      next();
      return;
    } else if (stage === "input" && lit !== -1 && H.elapsed >= until) {
      lit = -1;
      changed = true;
    }
    if (changed) render();
  }
  function render() {
    H.grid(2, ["1", "2", "3", "4"], press, (b, i) => {
      b.dataset.lit = String(lit === i);
      b.setAttribute(
        "aria-label",
        `Pole ${i + 1}${lit === i ? ", świeci" : ""}`,
      );
      b.setAttribute("aria-disabled", String(stage !== "input"));
    });
    startButton.disabled = stage !== "await" || !H.active();
    H.stats([
      sequence.length || "—",
      `${cursor} / ${sequence.length}`,
      SpinnerMore.number(SpinnerMore.prefs.get("more:echo", 0)),
    ]);
  }
  H.keys((key, e) => {
    if (/^[1-4]$/.test(key) && !e.repeat) {
      press(Number(key) - 1);
      return true;
    }
  });
  H.onTick = tick;
  H.onNew = newGame;
  H.onRender = render;
  window.MoreGame = {
    newGame,
    begin,
    press,
    tick,
    snapshot: () => ({
      sequence: [...sequence],
      cursor,
      stage,
      lit,
      completed,
      showAt,
      elapsed: H.elapsed,
      phase: H.phase,
    }),
  };
  newGame();
})();
