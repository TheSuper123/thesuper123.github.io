(() => {
  "use strict";
  const H = SpinnerMore.create(["PRÓBA", "TRAFIONE MIEJSCA", "CZAS"]);
  H.board.className = "mo-code-log";
  let secret = [],
    guess = [],
    attempts = [],
    slot = 0;
  const editor = document.createElement("div"),
    palette = document.createElement("div");
  editor.className = "mo-code-editor";
  palette.className = "mo-code-palette";
  H.extra.append(editor, palette);
  const submitButton = H.button(
    "Sprawdź kod",
    submit,
    H.controls,
    "ng-primary",
  );
  for (let i = 1; i <= 6; i++) H.button(String(i), () => enter(i), palette);
  H.button("Wymaż miejsce", () => enter(0), palette);
  const score = (code, values) => {
    let exact = 0;
    const a = Array(7).fill(0),
      b = Array(7).fill(0);
    for (let i = 0; i < 4; i++) {
      if (code[i] === values[i]) exact++;
      else {
        a[code[i]]++;
        b[values[i]]++;
      }
    }
    return {
      exact,
      misplaced: a.reduce((s, n, i) => s + Math.min(n, b[i]), 0),
    };
  };
  function newGame() {
    secret = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6));
    guess = Array(4).fill(0);
    attempts = [];
    slot = 0;
    H.reset();
    H.say(
      "Cyfry od 1 do 6 mogą się powtarzać. Wynik: miejsca / pozostałe cyfry.",
    );
    render();
  }
  function enter(value) {
    if (!H.active() || !Number.isInteger(value) || value < 0 || value > 6)
      return false;
    H.start();
    guess[slot] = value;
    if (value) slot = (slot + 1) % 4;
    render();
    return true;
  }
  function submit() {
    if (!H.active()) return false;
    if (guess.some((v) => !v)) {
      H.say("Uzupełnij wszystkie cztery miejsca.", "error");
      return false;
    }
    H.start();
    const result = score(secret, guess);
    attempts.push({ guess: [...guess], ...result });
    if (result.exact === 4) {
      H.record("codebreaker", attempts.length, true, "prób");
      H.finish(
        `Kod ${secret.join(" ")} złamany w ${attempts.length} ${attempts.length === 1 ? "próbie" : "próbach"}.`,
      );
    } else if (attempts.length === 10)
      H.finish(`Próby się skończyły. Kod: ${secret.join(" ")}.`, false);
    else {
      H.say(
        `${result.exact} na swoim miejscu; ${result.misplaced} poprawnych cyfr w innych miejscach.`,
      );
      guess = Array(4).fill(0);
      slot = 0;
    }
    render();
    return true;
  }
  function render() {
    H.board.replaceChildren();
    if (!attempts.length) {
      const p = document.createElement("p");
      p.className = "ng-help";
      p.textContent =
        "Tutaj pojawi się historia prób. Pierwsza liczba: poprawne miejsca. Druga: poprawne cyfry poza swoim miejscem.";
      H.board.append(p);
    }
    attempts.forEach((a, i) => {
      const row = document.createElement("div");
      row.className = "mo-code-row";
      row.innerHTML = `<span>${String(i + 1).padStart(2, "0")}</span><span class="mo-code-digits">${a.guess.join("")}</span><span>${a.exact} / ${a.misplaced}</span>`;
      row.setAttribute(
        "aria-label",
        `Próba ${i + 1}: ${a.guess.join(", ")}; miejsca ${a.exact}, inne cyfry ${a.misplaced}`,
      );
      H.board.append(row);
    });
    editor.replaceChildren();
    guess.forEach((v, i) => {
      const b = H.button(
        v ? String(v) : "·",
        () => {
          if (H.active()) {
            slot = i;
            render();
          }
        },
        editor,
      );
      b.setAttribute("aria-label", `Miejsce ${i + 1}: ${v || "puste"}`);
      b.setAttribute("aria-pressed", String(slot === i));
    });
    submitButton.disabled = !H.active();
    H.stats([
      `${Math.min(10, attempts.length + 1)} / 10`,
      attempts.at(-1)?.exact || 0,
      SpinnerMore.time(H.elapsed),
    ]);
  }
  H.keys((key, e) => {
    if (e.repeat) return false;
    if (/^[1-6]$/.test(key)) {
      enter(Number(key));
      return true;
    }
    if (key === "ArrowLeft" || key === "ArrowRight") {
      slot = (slot + (key === "ArrowLeft" ? 3 : 1)) % 4;
      render();
      return true;
    }
    if (key === "Backspace" || key === "Delete") {
      enter(0);
      return true;
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      !event.repeat &&
      !SpinnerMore.editing(event) &&
      H.active()
    ) {
      event.preventDefault();
      submit();
    }
  });
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = () =>
    H.stats([
      `${Math.min(10, attempts.length + 1)} / 10`,
      attempts.at(-1)?.exact || 0,
      SpinnerMore.time(H.elapsed),
    ]);
  window.MoreGame = {
    newGame,
    enter,
    submit,
    score,
    snapshot: () => ({
      secret: [...secret],
      guess: [...guess],
      attempts: attempts.map((a) => ({ ...a, guess: [...a.guess] })),
      slot,
      phase: H.phase,
    }),
  };
  newGame();
})();
