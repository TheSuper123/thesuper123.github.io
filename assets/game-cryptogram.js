(() => {
  "use strict";
  const S = SpinnerHundred,
    H = S.create(["LITERY", "BŁĘDY", "ZDANIE"]),
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    sentences = [
      "DOBRY PLAN ZACZYNA SIE OD MALEGO KROKU",
      "NOCNE NIEBO KRYJE WIECEJ PYTAN NIZ ODPOWIEDZI",
      "KAZDY ZAKRET OTWIERA NOWA DROGE",
      "CICHA PRZYSTAN CZEKA ZA OSTATNIM MOSTEM",
      "MALY OGROD POTRAFI ZMIENIC CALY DZIEN",
      "CZASAMI WARTO ZMIENIC PUNKT WIDZENIA",
    ];
  let state,
    selected = "",
    history = [];
  function enter(letter) {
    if (!H.active() || !selected || (letter && !alphabet.includes(letter)))
      return false;
    history.push(S.clone(state));
    if (letter) state.guesses[selected] = letter;
    else delete state.guesses[selected];
    H.start();
    if (
      [...new Set(state.cipher.replaceAll(" ", ""))].every(
        (c) => state.guesses[c] === state.decode[c],
      )
    )
      H.finish("Szyfr rozwiązany. Całe zdanie jest czytelne!");
    else H.render();
    return true;
  }
  H.button("Cofnij", () => {
    if (history.length && H.phase !== "paused") {
      state = history.pop();
      H.reopen();
      H.render();
    }
  });
  H.button("Sprawdź", () => {
    if (H.active()) {
      state.errors++;
      const wrong = Object.entries(state.guesses).filter(
        ([a, b]) => state.decode[a] !== b,
      ).length;
      H.say(
        wrong
          ? `${wrong} przypisań wymaga poprawki.`
          : "Dotychczasowe przypisania są poprawne.",
      );
      H.render();
    }
  });
  const keys = document.createElement("div");
  keys.className = "hu-keyboard";
  H.extra.append(keys);
  for (const c of alphabet) H.button(c, () => enter(c), keys);
  H.button("×", () => enter(""), keys);
  H.keys((k, e) => {
    if (e.repeat) return false;
    if (/^[a-zA-Z]$/.test(k)) {
      enter(k.toUpperCase());
      return true;
    }
    if (k === "Backspace") {
      enter("");
      return true;
    }
  });
  H.onRender = () => {
    H.stats([
      Object.keys(state.guesses).length +
        " / " +
        Object.keys(state.decode).length,
      state.errors,
      "SZYFR",
    ]);
    H.board.className = "hu-word-panel";
    H.board.replaceChildren();
    const words = document.createElement("div");
    words.className = "hu-cipher";
    for (const word of state.cipher.split(" ")) {
      const row = document.createElement("span");
      row.className = "hu-cipher-word";
      for (const c of word) {
        const b = H.button(
          "",
          () => {
            selected = c;
            H.render();
          },
          row,
        );
        b.innerHTML = `<strong>${state.guesses[c] || "·"}</strong><small>${c}</small>`;
        b.setAttribute("aria-pressed", String(c === selected));
        b.setAttribute(
          "aria-label",
          `Szyfr ${c}, odczyt ${state.guesses[c] || "nieznany"}`,
        );
      }
      words.append(row);
    }
    H.board.append(words);
    const p = document.createElement("p");
    p.textContent = `Wybierz znak szyfru i przypisz mu literę. ${selected ? "Wybrano: " + selected : ""}`;
    H.board.append(p);
  };
  H.onNew = () => {
    const text = S.shuffle(sentences)[0],
      letters = S.shuffle([...alphabet]),
      encode = Object.fromEntries([...alphabet].map((c, i) => [c, letters[i]])),
      cipher = [...text].map((c) => encode[c] || c).join(""),
      decode = {};
    for (let i = 0; i < text.length; i++)
      if (text[i] !== " ") decode[cipher[i]] = text[i];
    state = { cipher, decode, guesses: {}, errors: 0 };
    selected = cipher[0];
    history = [];
    H.reset();
    H.say(
      "Każda litera została zastąpiona zawsze tym samym znakiem. Zdania są autorskie, bez polskich znaków.",
    );
  };
  S.api(
    H,
    {
      enter,
      select: (c) => {
        if (state.decode[c]) {
          selected = c;
          H.render();
        }
      },
      getState: () => state,
    },
    () => state,
  );
  H.onNew();
})();
