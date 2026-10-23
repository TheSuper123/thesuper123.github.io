(() => {
  "use strict";
  const S = SpinnerHundred,
    H = S.create(["CEL", "DZIAŁANIA", "LICZBY"]);
  let state,
    history = [],
    first = -1,
    second = -1;
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a)),
    fraction = (a, b) => {
      if (!b) return null;
      const d = gcd(a, b);
      return { a: (a / d) * (b < 0 ? -1 : 1), b: Math.abs(b / d) };
    };
  function calc(x, y, op) {
    if (op === "+") return fraction(x.a * y.b + y.a * x.b, x.b * y.b);
    if (op === "−") return fraction(x.a * y.b - y.a * x.b, x.b * y.b);
    if (op === "×") return fraction(x.a * y.a, x.b * y.b);
    if (op === "÷") return fraction(x.a * y.b, x.b * y.a);
    return null;
  }
  function solve(items) {
    if (items.length === 1) return items[0].a === 24 * items[0].b ? [] : null;
    for (let i = 0; i < items.length; i++)
      for (let j = 0; j < items.length; j++)
        if (i !== j)
          for (const op of ["+", "−", "×", "÷"]) {
            const value = calc(items[i], items[j], op);
            if (!value || Math.abs(value.a) > 1e6) continue;
            const next = items
                .filter((_, k) => k !== i && k !== j)
                .concat(value),
              rest = solve(next);
            if (rest) return [[i, j, op], ...rest];
          }
    return null;
  }
  function combine(i, j, op) {
    if (!H.active() || i === j || !state.items[i] || !state.items[j])
      return false;
    const value = calc(state.items[i], state.items[j], op);
    if (!value) {
      H.say("Nie można dzielić przez zero.");
      return false;
    }
    history.push(S.clone(state));
    state.items = state.items
      .filter((_, k) => k !== i && k !== j)
      .concat({
        ...value,
        text: `(${state.items[i].text} ${op} ${state.items[j].text})`,
      });
    state.moves++;
    first = second = -1;
    H.start();
    if (state.items.length === 1) {
      if (value.a === 24 * value.b) H.finish("Dokładnie 24. Dobre obliczenia!");
      else H.say("Wynik to nie 24. Cofnij i spróbuj innego działania.");
    }
    H.render();
    return true;
  }
  const undo = () => {
    if (!history.length || H.phase === "paused") return;
    state = history.pop();
    first = second = -1;
    H.reopen();
    H.render();
  };
  H.button("Cofnij", undo);
  for (const op of ["+", "−", "×", "÷"])
    H.button(op, () => combine(first, second, op), H.extra);
  H.onRender = () => {
    H.stats([24, state.moves, state.items.length]);
    H.board.className = "hu-arithmetic";
    H.board.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = "Z czterech liczb zrób 24.";
    H.board.append(heading);
    const rack = document.createElement("div");
    rack.className = "hu-rack";
    H.board.append(rack);
    state.items.forEach((v, i) => {
      const b = H.button(
        v.b === 1 ? String(v.a) : v.a + "/" + v.b,
        () => {
          if (first === i) {
            first = second;
            second = -1;
          } else if (second === i) second = -1;
          else if (first < 0) first = i;
          else second = i;
          H.render();
        },
        rack,
        "hu-token",
      );
      b.setAttribute("aria-pressed", String(first === i || second === i));
      b.title = v.text;
    });
    const info = document.createElement("p");
    info.className = "hu-rules-note";
    info.textContent =
      first < 0
        ? "Wybierz pierwszą, drugą liczbę i działanie."
        : `Pierwsza: ${state.items[first]?.text}. ${second < 0 ? "Wybierz drugą." : "Teraz wybierz działanie."}`;
    H.board.append(info);
  };
  H.onNew = () => {
    let numbers, solution;
    do {
      numbers = Array.from(
        { length: 4 },
        () => 1 + Math.floor(Math.random() * 9),
      );
      solution = solve(numbers.map((a) => ({ a, b: 1 })));
    } while (!solution);
    state = {
      items: numbers.map((a) => ({ a, b: 1, text: String(a) })),
      numbers,
      solution,
      moves: 0,
    };
    history = [];
    first = second = -1;
    H.reset();
    H.say("Użyj wszystkich czterech liczb. Ułamki liczymy dokładnie.");
  };
  S.api(H, { combine, undo, solve, calc, getState: () => state }, () => state);
  H.onNew();
})();
