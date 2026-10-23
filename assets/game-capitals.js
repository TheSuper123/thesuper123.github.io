(() => {
  "use strict";
  const S = SpinnerHundred,
    H = S.create(["DOBRE", "PYTANIE", "SERIA"]),
    countries = [
      ["Polska", "Warszawa"],
      ["Czechy", "Praga"],
      ["Słowacja", "Bratysława"],
      ["Niemcy", "Berlin"],
      ["Francja", "Paryż"],
      ["Hiszpania", "Madryt"],
      ["Portugalia", "Lizbona"],
      ["Włochy", "Rzym"],
      ["Austria", "Wiedeń"],
      ["Węgry", "Budapeszt"],
      ["Litwa", "Wilno"],
      ["Łotwa", "Ryga"],
      ["Estonia", "Tallinn"],
      ["Szwecja", "Sztokholm"],
      ["Norwegia", "Oslo"],
      ["Finlandia", "Helsinki"],
      ["Dania", "Kopenhaga"],
      ["Islandia", "Reykjavík"],
      ["Irlandia", "Dublin"],
      ["Grecja", "Ateny"],
      ["Rumunia", "Bukareszt"],
      ["Bułgaria", "Sofia"],
      ["Chorwacja", "Zagrzeb"],
      ["Słowenia", "Lublana"],
      ["Serbia", "Belgrad"],
      ["Japonia", "Tokio"],
      ["Kanada", "Ottawa"],
      ["Australia", "Canberra"],
      ["Brazylia", "Brasília"],
      ["Argentyna", "Buenos Aires"],
    ];
  let state;
  function next() {
    const entry = state.questions[state.index];
    state.country = entry[0];
    state.expected = entry[1];
    state.options = S.shuffle([
      entry[1],
      ...S.shuffle(countries.filter((c) => c[1] !== entry[1]))
        .slice(0, 3)
        .map((c) => c[1]),
    ]);
  }
  function answer(v) {
    if (!H.active() || !state.options.includes(v)) return false;
    H.start();
    const ok = v === state.expected;
    state.answers.push({
      country: state.country,
      expected: state.expected,
      answer: v,
    });
    if (ok) {
      state.correct++;
      state.streak++;
    } else state.streak = 0;
    state.index++;
    if (state.index === 15)
      H.finish(`${state.correct} / 15 stolic. Czas: ${S.time(H.elapsed)}.`);
    else {
      H.say(ok ? "Dobrze!" : `${state.country}: ${state.expected}.`);
      next();
      H.render();
    }
    return ok;
  }
  H.onRender = () => {
    H.stats([
      state.correct,
      Math.min(15, state.index + 1) + " / 15",
      state.streak,
    ]);
    H.board.className = "hu-word-panel";
    H.board.replaceChildren();
    const small = document.createElement("p"),
      title = document.createElement("h3"),
      choices = document.createElement("div");
    small.textContent = "Stolica kraju:";
    title.textContent = state.country;
    choices.className = "hu-answers";
    state.options.forEach((v, i) =>
      H.button(`${i + 1}. ${v}`, () => answer(v), choices),
    );
    H.board.append(small, title, choices);
  };
  H.keys((k, e) => {
    if (!e.repeat && /^[1-4]$/.test(k)) {
      answer(state.options[Number(k) - 1]);
      return true;
    }
  });
  H.onNew = () => {
    state = {
      questions: S.shuffle(countries).slice(0, 15),
      index: 0,
      correct: 0,
      streak: 0,
      answers: [],
    };
    next();
    H.reset();
    H.say(
      "Piętnaście pytań z trzydziestu krajów. Stolice bez zewnętrznych map ani usług.",
    );
  };
  S.api(H, { answer, getState: () => state }, () => state);
  H.onNew();
})();
