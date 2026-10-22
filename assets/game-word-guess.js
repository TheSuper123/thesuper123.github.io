(() => {
  "use strict";
  const H = SpinnerMore.create(["KATEGORIA", "POMYŁKI", "SERIA"]);
  H.board.className = "mo-letter-stage";
  H.pauseKey = null;
  const categories = {
    natura: [
      "ŻÓŁW",
      "JEŻYNA",
      "WRÓBEL",
      "SŁONECZNIK",
      "BRZOZA",
      "ŹRÓDŁO",
      "ŁĄKA",
      "PAPROĆ",
      "WIEWIÓRKA",
      "BOCIAN",
    ],
    dom: [
      "SZUFLADA",
      "ŁYŻECZKA",
      "PODUSZKA",
      "DYWAN",
      "ZASŁONA",
      "CZAJNIK",
      "KSIĄŻKA",
      "FOTEL",
      "DONICZKA",
      "LUSTRO",
    ],
    droga: [
      "PODRÓŻ",
      "PLECAK",
      "ŚCIEŻKA",
      "POCIĄG",
      "ŻAGLÓWKA",
      "ROWER",
      "WĘDRÓWKA",
      "PRZYSTANEK",
      "BAGAŻ",
      "BILET",
    ],
  };
  const names = { natura: "Natura", dom: "Dom", droga: "W drodze" },
    alphabet = Array.from("AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ");
  let category = "natura",
    word = "",
    previous = "",
    guessed = new Set(),
    mistakes = 0,
    streak = 0;
  H.select(
    "SŁOWA",
    Object.keys(categories).map((k) => [k, names[k]]),
    (v) => {
      category = v;
      streak = 0;
      newGame();
    },
  );
  const keys = document.createElement("div");
  keys.className = "mo-alphabet";
  H.extra.append(keys);
  function newGame() {
    const options = categories[category].filter((w) => w !== previous);
    word = options[Math.floor(Math.random() * options.length)];
    previous = word;
    guessed = new Set();
    mistakes = 0;
    H.reset();
    H.record("word-guess:streak");
    H.say("Siedem pomyłek. Litery można wybierać także na klawiaturze.");
    render();
  }
  function guess(letter) {
    letter = String(letter).toLocaleUpperCase("pl");
    if (!H.active() || !alphabet.includes(letter) || guessed.has(letter))
      return false;
    H.start();
    guessed.add(letter);
    if (!word.includes(letter)) mistakes++;
    if (Array.from(word).every((c) => guessed.has(c))) {
      streak++;
      H.record("word-guess:streak", streak);
      H.finish(`Odgadnięte: ${word}. Seria: ${streak}.`);
    } else if (mistakes >= 7) {
      streak = 0;
      H.finish(
        `Szukane słowo: ${word}. Następne czeka w nowej rundzie.`,
        false,
      );
    } else
      H.say(
        word.includes(letter)
          ? `Jest litera ${letter}!`
          : `Litery ${letter} nie ma w tym słowie.`,
      );
    render();
    return true;
  }
  function render() {
    const revealed = H.phase === "lost",
      text = Array.from(word, (c) =>
        guessed.has(c) || revealed ? c : "_",
      ).join(" ");
    H.board.innerHTML = `<svg viewBox="0 0 150 130" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 116h126M30 116V25h90v91" opacity=".3"/>${Array.from({ length: 7 }, (_, i) => `<rect x="${38 + (i % 3) * 26}" y="${35 + Math.floor(i / 3) * 26}" width="19" height="19" rx="2" ${i < mistakes ? 'fill="currentColor"' : 'opacity=".2"'}/>`).join("")}</svg><div class="mo-word" aria-label="Słowo: ${text}">${text}</div>`;
    const focused = document.activeElement?.dataset.letter;
    keys.replaceChildren(
      ...alphabet.map((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = c;
        b.dataset.letter = c;
        b.dataset.correct = String(guessed.has(c) && word.includes(c));
        b.disabled = guessed.has(c) || !H.active();
        b.setAttribute(
          "aria-label",
          `${c}${guessed.has(c) ? (word.includes(c) ? ", trafiona" : ", brak w słowie") : ""}`,
        );
        b.onclick = () => guess(c);
        return b;
      }),
    );
    if (focused) {
      const next = keys.querySelector(`[data-letter="${focused}"]`);
      if (next && !next.disabled) next.focus({ preventScroll: true });
    }
    H.stats([names[category], `${mistakes} / 7`, streak]);
  }
  H.keys((key, e) => {
    if (
      key.length === 1 &&
      alphabet.includes(key.toLocaleUpperCase("pl")) &&
      !e.repeat
    ) {
      guess(key);
      return true;
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      !event.repeat &&
      (event.altKey || event.ctrlKey) &&
      "ĄĆĘŁŃÓŚŹŻąćęłńóśźż".includes(event.key) &&
      event.key.length === 1 &&
      !event.target.closest?.("input,textarea,select,[contenteditable=true]") &&
      H.active()
    ) {
      event.preventDefault();
      guess(event.key);
    }
  });
  H.onRender = render;
  H.onNew = newGame;
  window.MoreGame = {
    newGame,
    guess,
    categories,
    snapshot: () => ({
      word,
      guessed: [...guessed],
      mistakes,
      streak,
      category,
      phase: H.phase,
    }),
  };
  newGame();
})();
