(() => {
  "use strict";
  const {
    prefs,
    number,
    shuffle,
    clock,
    time,
    editing,
    pauses,
    names,
    symbol,
  } = SpinnerNew;
  const $ = (id) => document.getElementById(id),
    board = $("board"),
    timer = clock();
  let cards,
    open,
    matched,
    pairs,
    attempts,
    phase,
    resolveAt,
    focusIndex = 0;
  function record() {
    const value = prefs.get(`new:memory:best:${pairs}`, null);
    return value &&
      Number.isInteger(value.moves) &&
      value.moves >= pairs &&
      Number.isFinite(value.time) &&
      value.time >= 0
      ? value
      : null;
  }
  function stats() {
    $("memory-time").textContent = time(timer.elapsed);
    $("memory-moves").textContent = attempts;
    $("memory-pairs").textContent = `${matched.size / 2} / ${pairs}`;
    const best = record();
    $("memory-record").textContent = best
      ? `Najlepsza runda: ${best.moves} prób · ${time(best.time)}`
      : "Każdy rozmiar ma osobny rekord.";
  }
  function say(text, result = "") {
    $("memory-status").textContent = text;
    $("memory-status").dataset.result = result;
  }
  function render() {
    const restoreFocus = board.contains(document.activeElement);
    if (matched.has(focusIndex))
      focusIndex = cards.findIndex((_, i) => !matched.has(i));
    board.dataset.pairs = pairs;
    board.replaceChildren(
      ...cards.map((token, index) => {
        const face = open.includes(index) || matched.has(index),
          card = document.createElement("button");
        card.type = "button";
        card.className = "mem-card";
        card.dataset.index = index;
        card.dataset.face = String(face);
        card.dataset.matched = String(matched.has(index));
        card.disabled = matched.has(index);
        card.tabIndex = index === focusIndex ? 0 : -1;
        card.setAttribute(
          "aria-label",
          `Karta ${index + 1}: ${face ? names[token] + (matched.has(index) ? ", znaleziona para" : "") : "zakryta"}`,
        );
        card.innerHTML = face
          ? symbol(token)
          : '<span class="mem-back" aria-hidden="true">?</span>';
        card.onclick = () => {
          focusIndex = index;
          flip(index);
        };
        return card;
      }),
    );
    $("memory-cover").hidden = phase !== "paused" && phase !== "won";
    $("memory-pause").textContent = phase === "paused" ? "Wznów" : "Pauza";
    $("memory-pause").disabled = phase === "won";
    $("memory-resume").hidden = phase === "won";
    $("memory-again").hidden = phase !== "won";
    $("memory-cover-title").textContent =
      phase === "won" ? "Wszystkie pary na miejscu." : "Karty zaczekają.";
    $("memory-cover-copy").textContent =
      phase === "won"
        ? `${attempts} prób · ${time(timer.elapsed)}. Następna runda ma nowy układ.`
        : "Zegar i odkryte karty pozostają zatrzymane.";
    stats();
    if (restoreFocus && ["ready", "playing"].includes(phase))
      board
        .querySelector(`[data-index="${focusIndex}"]`)
        ?.focus({ preventScroll: true });
  }
  function newGame() {
    pairs = Number($("memory-level").value);
    if (![6, 8, 12].includes(pairs)) pairs = 8;
    const tokens = shuffle(Array.from({ length: 12 }, (_, i) => i)).slice(
      0,
      pairs,
    );
    cards = shuffle([...tokens, ...tokens]);
    open = [];
    matched = new Set();
    attempts = 0;
    phase = "ready";
    resolveAt = null;
    focusIndex = 0;
    timer.reset();
    say("Odkryj pierwszą kartę.");
    render();
  }
  function flip(index) {
    if (
      !["ready", "playing"].includes(phase) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= cards.length ||
      matched.has(index) ||
      open.includes(index) ||
      open.length === 2
    )
      return false;
    if (phase === "ready") {
      phase = "playing";
      timer.start();
    }
    open.push(index);
    if (open.length === 2) {
      attempts++;
      if (cards[open[0]] === cards[open[1]]) {
        matched.add(open[0]);
        matched.add(open[1]);
        open = [];
        say(`Para: ${names[cards[index]].toLowerCase()}.`);
        if (matched.size === cards.length) {
          phase = "won";
          timer.stop();
          const best = record();
          if (
            !best ||
            attempts < best.moves ||
            (attempts === best.moves && timer.elapsed < best.time)
          )
            prefs.set(`new:memory:best:${pairs}`, {
              moves: attempts,
              time: Math.round(timer.elapsed),
            });
          say("Cała talia odkryta. Dobra pamięć!", "win");
        }
      } else {
        resolveAt = timer.elapsed + 650;
        say("Zapamiętaj te dwa miejsca.");
      }
    } else say("Gdzie jest drugi taki znak?");
    render();
    return true;
  }
  function pause() {
    if (phase !== "playing") return;
    phase = "paused";
    timer.stop();
    render();
  }
  function resume() {
    if (phase !== "paused") return;
    phase = "playing";
    timer.start();
    render();
    board
      .querySelector(`[data-index="${focusIndex}"]`)
      ?.focus({ preventScroll: true });
  }
  const interval = setInterval(() => {
    if (phase !== "playing") return;
    if (resolveAt !== null && timer.elapsed >= resolveAt) {
      open = [];
      resolveAt = null;
      render();
      say("Nowa próba. Wykorzystaj to, co pamiętasz.");
    }
    stats();
  }, 100);
  board.addEventListener("keydown", (event) => {
    const index = Number(event.target.dataset.index);
    if (!Number.isInteger(index)) return;
    const columns = Number(
      getComputedStyle(board).gridTemplateColumns.split(" ").length,
    );
    const delta = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns,
      ArrowDown: columns,
    }[event.key];
    if (delta) {
      event.preventDefault();
      let next = index;
      for (let i = 0; i < cards.length; i++) {
        next = (next + delta + cards.length) % cards.length;
        if (!matched.has(next)) break;
      }
      focusIndex = next;
      board
        .querySelectorAll("button")
        .forEach((button, i) => (button.tabIndex = i === next ? 0 : -1));
      board
        .querySelector(`[data-index="${next}"]`)
        ?.focus({ preventScroll: true });
    }
  });
  $("memory-new").onclick = $("memory-again").onclick = newGame;
  $("memory-level").onchange = newGame;
  $("memory-resume").onclick = resume;
  $("memory-pause").onclick = () => (phase === "paused" ? resume() : pause());
  document.addEventListener("keydown", (event) => {
    if (!editing(event) && event.key.toLowerCase() === "p" && !event.repeat) {
      event.preventDefault();
      phase === "paused" ? resume() : pause();
    }
  });
  pauses(pause);
  window.addEventListener("spinner:preferences-cleared", stats);
  window.SpinnerGame = { render, pause };
  window.MemoryGame = {
    newGame,
    flip,
    snapshot: () => ({
      cards: [...cards],
      open: [...open],
      matched: [...matched],
      pairs,
      attempts,
      phase,
      elapsed: timer.elapsed,
    }),
  };
  newGame();
})();
