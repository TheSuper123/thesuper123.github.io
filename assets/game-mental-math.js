(() => {
  "use strict";
  const S = SpinnerHundred,
    H = S.create(["DOBRE", "PYTANIE", "CZAS"]);
  let state;
  function question() {
    const a = 2 + Math.floor(Math.random() * 18),
      b = 2 + Math.floor(Math.random() * 10),
      op = Math.floor(Math.random() * 4);
    if (op === 0) return { text: `${a} + ${b}`, answer: a + b };
    if (op === 1) return { text: `${a + b} − ${b}`, answer: a };
    if (op === 2) return { text: `${a} × ${b}`, answer: a * b };
    return { text: `${a * b} ÷ ${b}`, answer: a };
  }
  function next() {
    state.current = question();
    state.options = S.shuffle([
      state.current.answer,
      ...S.shuffle(
        Array.from(
          { length: 9 },
          (_, i) => state.current.answer + i - 4,
        ).filter((v) => v !== state.current.answer),
      ).slice(0, 3),
    ]);
  }
  function answer(v) {
    if (!H.active() || !state.options.includes(v)) return false;
    H.start();
    const ok = v === state.current.answer;
    state.results.push({
      text: state.current.text,
      expected: state.current.answer,
      answer: v,
    });
    if (ok) state.correct++;
    if (state.results.length === 20)
      H.finish(`${state.correct} / 20. Czas: ${S.time(H.elapsed)}.`);
    else {
      H.say(
        ok
          ? "Dobrze. Następne działanie."
          : `Poprawny wynik: ${state.current.answer}.`,
      );
      next();
      H.render();
    }
    return ok;
  }
  H.onRender = () => {
    H.stats([
      state.correct,
      Math.min(20, state.results.length + 1) + " / 20",
      S.time(H.elapsed),
    ]);
    H.board.className = "hu-word-panel";
    H.board.replaceChildren();
    const title = document.createElement("h3");
    title.textContent = state.current.text + " = ?";
    title.style.fontSize = "clamp(30px,8vmin,70px)";
    const choices = document.createElement("div");
    choices.className = "hu-answers";
    state.options.forEach((v, i) =>
      H.button(`${i + 1}. ${v}`, () => answer(v), choices),
    );
    H.board.append(title, choices);
  };
  H.keys((k, e) => {
    if (!e.repeat && /^[1-4]$/.test(k)) {
      answer(state.options[Number(k) - 1]);
      return true;
    }
  });
  H.onTick = () =>
    H.stats([
      state.correct,
      Math.min(20, state.results.length + 1) + " / 20",
      S.time(H.elapsed),
    ]);
  H.onNew = () => {
    state = { correct: 0, results: [] };
    next();
    H.reset();
    H.say("Dwadzieścia działań, dokładne dzielenie. Liczy się wynik i czas.");
  };
  S.api(H, { answer, question, getState: () => state }, () => state);
  H.onNew();
})();
