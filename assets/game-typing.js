(() => {
  "use strict";
  const S = SpinnerHundred,
    H = S.create(["ZNAKI / MIN", "DOKŁADNOŚĆ", "CZAS"]),
    texts = [
      "Jesienny wiatr przewraca kartki na stole. Za oknem powoli gasną światła miasta. Zostaje chwila na książkę, ciepłą herbatę i spokojną rozmowę.",
      "W małym warsztacie pachnie drewnem. Każda deska ma inny rysunek słojów. Cierpliwe dłonie łączą proste części w przedmiot, który zostanie na lata.",
      "Ścieżka prowadzi wzdłuż rzeki, pod starym mostem i dalej między drzewa. Rano jest tutaj cicho. Słychać wodę, kroki i pierwsze ptaki nad brzegiem.",
    ];
  let state;
  H.pauseKey = null;
  H.board.className = "hu-word-panel";
  const target = document.createElement("p"),
    input = document.createElement("textarea");
  input.className = "hu-input";
  input.rows = 3;
  input.setAttribute("aria-label", "Przepisz tekst");
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("autocapitalize", "off");
  H.board.append(target, input);
  function metrics() {
    const chars = [...state.typed],
      correct = chars.filter((c, i) => c === [...state.text][i]).length,
      elapsed = Math.max(1, H.elapsed) / 60000;
    return {
      correct,
      accuracy: chars.length ? Math.round((correct / chars.length) * 100) : 100,
      cpm: Math.round(correct / elapsed),
      wpm: Math.round(correct / 5 / elapsed),
    };
  }
  function finish() {
    const m = metrics();
    H.finish(
      `${m.cpm} poprawnych znaków/min (${m.wpm} słów/min). Dokładność ${m.accuracy}%.`,
    );
  }
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    H.say("Przepisz tekst klawiszami — wklejanie nie jest liczone.");
  });
  input.oninput = () => {
    if (!H.active()) {
      input.value = state.typed;
      return;
    }
    H.start();
    state.typed = input.value.slice(0, state.text.length);
    if (input.value !== state.typed) input.value = state.typed;
    if (state.typed === state.text) finish();
    else H.render();
  };
  H.onRender = () => {
    const m = metrics();
    H.stats([
      H.elapsed ? m.cpm : 0,
      m.accuracy + "%",
      Math.max(0, 60 - Math.floor(H.elapsed / 1000)) + " s",
    ]);
    target.replaceChildren();
    [...state.text].forEach((c, i) => {
      const span = document.createElement("span");
      span.textContent = c;
      if (i < state.typed.length)
        span.style.color =
          c === state.typed[i] ? "var(--green)" : "var(--accent)";
      if (i === state.typed.length) span.style.textDecoration = "underline";
      target.append(span);
    });
    input.disabled = !H.active();
  };
  H.onTick = () => {
    if (H.elapsed >= 60000) finish();
    else H.render();
  };
  H.onNew = () => {
    state = { text: S.shuffle(texts)[0], typed: "" };
    input.value = "";
    H.reset();
    H.say(
      "Masz minutę. Zegar ruszy z pierwszym znakiem. Poprawiaj błędy klawiszem Backspace.",
    );
  };
  S.api(H, { metrics, getState: () => state }, () => state);
  H.onNew();
})();
