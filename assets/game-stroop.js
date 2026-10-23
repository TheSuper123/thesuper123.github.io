(() => {
  "use strict";
  const S = SpinnerHundred,
    H = S.create(["PUNKTY", "SERIA", "CZAS"]),
    names = ["Czerwony", "Zielony", "Niebieski", "Żółty"],
    colors = ["#b63d29", "#287648", "#356fba", "#b48013"];
  let state;
  function next() {
    state.word = Math.floor(Math.random() * 4);
    state.ink = Math.floor(Math.random() * 4);
  }
  function answer(i) {
    if (!H.active() || !Number.isInteger(i) || i < 0 || i > 3) return false;
    H.start();
    const ok = i === state.ink;
    if (ok) {
      state.score += 10 + Math.min(10, state.streak);
      state.streak++;
      state.right++;
    } else {
      state.streak = 0;
      state.wrong++;
      state.score = Math.max(0, state.score - 5);
    }
    next();
    H.say(
      ok
        ? "Trafione. Patrz na kolor farby."
        : "To było znaczenie słowa. Liczy się kolor liter.",
    );
    H.render();
    return ok;
  }
  H.onRender = () => {
    H.stats([
      state.score,
      state.streak,
      Math.max(0, 45 - Math.floor(H.elapsed / 1000)) + " s",
    ]);
    H.board.className = "hu-word-panel";
    H.board.replaceChildren();
    const p = document.createElement("p"),
      word = document.createElement("h3"),
      answers = document.createElement("div");
    p.textContent = "Jaki KOLOR mają litery?";
    word.textContent = names[state.word].toUpperCase();
    word.style.color = colors[state.ink];
    word.style.fontSize = "clamp(25px,7vmin,64px)";
    answers.className = "hu-answers";
    names.forEach((name, i) =>
      H.button(i + 1 + ". " + name, () => answer(i), answers),
    );
    H.board.append(p, word, answers);
  };
  H.onTick = () => {
    if (H.elapsed >= 45000)
      H.finish(
        `${state.score} punktów. Poprawnie: ${state.right}, pomyłki: ${state.wrong}.`,
      );
    else
      H.stats([
        state.score,
        state.streak,
        Math.max(0, 45 - Math.floor(H.elapsed / 1000)) + " s",
      ]);
  };
  H.keys((k, e) => {
    if (!e.repeat && /^[1-4]$/.test(k)) {
      answer(Number(k) - 1);
      return true;
    }
  });
  H.onNew = () => {
    state = { score: 0, streak: 0, right: 0, wrong: 0 };
    next();
    H.reset();
    H.say("Kolor i słowo mogą się różnić. Wybieraj kolor liter.");
  };
  S.api(H, { answer, getState: () => state }, () => state);
  H.onNew();
})();
