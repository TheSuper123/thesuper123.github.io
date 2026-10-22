(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["WYNIK", "RUNDA", "RZUTY"]);
  H.board.className = "th-scores";
  H.board.dataset.aspect = "1.1";
  let s;
  const names = [
    "Jedynki",
    "Dwójki",
    "Trójki",
    "Czwórki",
    "Piątki",
    "Szóstki",
    "Trójka",
    "Czwórka",
    "Full",
    "Mały strit",
    "Duży strit",
    "Pięć równych",
    "Szansa",
  ];
  const dice = document.createElement("div");
  dice.className = "th-dice";
  H.extra.append(dice);
  const rollButton = H.button("Rzuć kośćmi", roll, H.controls, "ng-primary");
  function score(values, category) {
    const count = Array(7).fill(0);
    values.forEach((v) => count[v]++);
    const sum = values.reduce((a, b) => a + b, 0),
      unique = new Set(values);
    if (category < 6) return count[category + 1] * (category + 1);
    if (category === 6) return count.some((n) => n >= 3) ? sum : 0;
    if (category === 7) return count.some((n) => n >= 4) ? sum : 0;
    if (category === 8) return count.includes(3) && count.includes(2) ? 25 : 0;
    if (category === 9)
      return [
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6],
      ].some((row) => row.every((v) => unique.has(v)))
        ? 30
        : 0;
    if (category === 10)
      return [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6],
      ].some((row) => row.every((v) => unique.has(v)))
        ? 40
        : 0;
    if (category === 11) return count.includes(5) ? 50 : 0;
    return sum;
  }
  function total() {
    const upper = s.scores.slice(0, 6).reduce((a, b) => a + (b || 0), 0);
    return s.scores.reduce((a, b) => a + (b || 0), 0) + (upper >= 63 ? 35 : 0);
  }
  function newGame() {
    s = {
      dice: [1, 1, 1, 1, 1],
      held: Array(5).fill(false),
      rolls: 0,
      scores: Array(13).fill(null),
    };
    H.reset();
    H.record("dice");
    H.say("Do trzech rzutów. Potem wybierz jedną wolną kategorię.");
    render();
  }
  function roll() {
    if (!H.active() || s.rolls >= 3) return false;
    H.start();
    s.dice = s.dice.map((v, i) =>
      s.held[i] ? v : 1 + Math.floor(Math.random() * 6),
    );
    s.rolls++;
    H.say("Zatrzymaj wybrane kości albo zapisz wynik w kategorii.");
    render();
    return true;
  }
  function hold(i) {
    if (!H.active() || !s.rolls || i < 0 || i > 4) return false;
    s.held[i] = !s.held[i];
    render();
    return true;
  }
  function choose(i) {
    if (!H.active() || !s.rolls || s.scores[i] !== null || i < 0 || i > 12)
      return false;
    s.scores[i] = score(s.dice, i);
    s.rolls = 0;
    s.held.fill(false);
    if (s.scores.every((v) => v !== null)) {
      H.record("dice", total());
      H.finish(`Wszystkie kategorie zapisane. Wynik: ${total()} punktów.`);
    } else H.say("Nowa runda. Rzuć wszystkimi kośćmi.");
    render();
    return true;
  }
  function render() {
    H.board.replaceChildren(
      ...names.map((name, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.category = i;
        b.dataset.used = String(s.scores[i] !== null);
        b.innerHTML = `<span>${name}</span><strong>${s.scores[i] ?? (s.rolls ? score(s.dice, i) : "—")}</strong>`;
        b.disabled = s.scores[i] !== null || !s.rolls;
        b.onclick = () => choose(i);
        return b;
      }),
    );
    dice.replaceChildren(
      ...s.dice.map((v, i) => {
        const b = H.button(
          String(v),
          () => hold(i),
          document.createDocumentFragment(),
        );
        b.dataset.held = String(s.held[i]);
        b.setAttribute("aria-pressed", String(s.held[i]));
        b.setAttribute(
          "aria-label",
          `Kość ${i + 1}: ${v}${s.held[i] ? ", zatrzymana" : ""}`,
        );
        return b;
      }),
    );
    rollButton.disabled = s.rolls >= 3 || !H.active();
    H.stats([
      total(),
      `${s.scores.filter((v) => v !== null).length + 1 > 13 ? 13 : s.scores.filter((v) => v !== null).length + 1} / 13`,
      `${s.rolls} / 3`,
    ]);
  }
  H.keys((key, e) => {
    if (e.repeat) return false;
    if (key === " ") {
      roll();
      return true;
    }
    if (/^[1-5]$/.test(key)) {
      hold(Number(key) - 1);
      return true;
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  S.api(H, { roll, hold, choose, score, total }, () => s);
  newGame();
})();
