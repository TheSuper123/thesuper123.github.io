(() => {
  "use strict";
  const { prefs, number, editing, press, pauses } = SpinnerNew;
  const $ = (id) => document.getElementById(id),
    grid = $("board");
  let board,
    score,
    moves,
    history,
    phase,
    beforePause,
    reached,
    keepPlaying,
    merged = [];
  let best = number(prefs.get("new:2048:best", 0));
  const keys = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
    w: "up",
    d: "right",
    s: "down",
    a: "left",
  };
  function slide(line) {
    const compact = line.filter(Boolean),
      result = [],
      hits = [];
    let points = 0;
    for (let i = 0; i < compact.length; i++) {
      if (compact[i] === compact[i + 1]) {
        const value = compact[i] * 2;
        result.push(value);
        points += value;
        hits.push(result.length - 1);
        i++;
      } else result.push(compact[i]);
    }
    while (result.length < 4) result.push(0);
    return { line: result, points, hits };
  }
  function transform(values, direction) {
    const result = [...values],
      hits = [];
    let points = 0;
    for (let row = 0; row < 4; row++) {
      const indexes = Array.from({ length: 4 }, (_, column) =>
        direction === "left"
          ? row * 4 + column
          : direction === "right"
            ? row * 4 + 3 - column
            : direction === "up"
              ? column * 4 + row
              : (3 - column) * 4 + row,
      );
      const next = slide(indexes.map((index) => values[index]));
      indexes.forEach((index, i) => (result[index] = next.line[i]));
      hits.push(...next.hits.map((i) => indexes[i]));
      points += next.points;
    }
    return {
      board: result,
      points,
      hits,
      changed: result.some((value, i) => value !== values[i]),
    };
  }
  function hasMoves(values) {
    return values.some(
      (value, index) =>
        !value ||
        (index % 4 < 3 && value === values[index + 1]) ||
        (index < 12 && value === values[index + 4]),
    );
  }
  function spawn() {
    const empty = board.flatMap((value, index) => (value ? [] : [index]));
    if (empty.length)
      board[empty[Math.floor(Math.random() * empty.length)]] =
        Math.random() < 0.9 ? 2 : 4;
  }
  function say(text, result = "") {
    $("tiles-status").textContent = text;
    $("tiles-status").dataset.result = result;
  }
  function render() {
    grid.replaceChildren(
      ...board.map((value, i) => {
        const tile = document.createElement("div");
        tile.className =
          "number-tile" + (merged.includes(i) ? " is-merge" : "");
        tile.dataset.value = value;
        tile.dataset.high = String(value >= 128);
        tile.setAttribute("role", "gridcell");
        tile.setAttribute(
          "aria-label",
          `Wiersz ${Math.floor(i / 4) + 1}, kolumna ${(i % 4) + 1}: ${value || "puste"}`,
        );
        tile.textContent = value || "";
        return tile;
      }),
    );
    $("tiles-score").textContent = score;
    $("tiles-best").textContent = best;
    $("tiles-moves").textContent = moves;
    $("tiles-undo").disabled = !history || phase === "paused";
    $("tiles-pause").disabled = phase === "over" || phase === "won";
    $("tiles-pause").textContent = phase === "paused" ? "Wznów" : "Pauza";
    $("tiles-cover").hidden = phase === "playing";
    $("tiles-continue").hidden = phase === "over";
    if (phase === "paused") {
      $("tiles-cover-title").textContent = "Liczby zaczekają.";
      $("tiles-cover-copy").textContent = "Wznów, gdy będziesz gotowy.";
      $("tiles-continue").textContent = "Wznów";
    }
    if (phase === "won") {
      $("tiles-cover-title").textContent = "Jest 2048!";
      $("tiles-cover-copy").textContent =
        `Wynik: ${score}. Możesz spróbować dojść jeszcze dalej.`;
      $("tiles-continue").textContent = "Gram dalej";
    }
    if (phase === "over") {
      $("tiles-cover-title").textContent = "Brak wolnego ruchu.";
      $("tiles-cover-copy").textContent =
        `Wynik: ${score}. Możesz też cofnąć ostatni ruch przyciskiem pod nagłówkiem.`;
    }
  }
  function newGame() {
    board = Array(16).fill(0);
    score = moves = 0;
    phase = "playing";
    history = null;
    reached = keepPlaying = false;
    merged = [];
    spawn();
    spawn();
    say("Łącz liczby i zostawiaj sobie wolny narożnik.");
    render();
    grid.focus({ preventScroll: true });
  }
  function move(direction) {
    if (
      phase !== "playing" ||
      !["left", "right", "up", "down"].includes(direction)
    )
      return false;
    const next = transform(board, direction);
    if (!next.changed) {
      if (!hasMoves(board)) phase = "over";
      render();
      return false;
    }
    history = { board: [...board], score, moves, reached, keepPlaying };
    board = next.board;
    merged = next.hits;
    score += next.points;
    moves++;
    spawn();
    if (score > best) {
      best = score;
      prefs.set("new:2048:best", best);
    }
    say(
      next.points
        ? `Połączono liczby. +${next.points} punktów.`
        : "Dobry ruch robi miejsce.",
    );
    if (!reached && board.some((value) => value >= 2048)) {
      reached = true;
      phase = "won";
      say("Cel osiągnięty — 2048!", "win");
    } else if (!hasMoves(board)) {
      phase = "over";
      say("Nie ma już możliwego połączenia.");
    }
    render();
    return true;
  }
  function undo() {
    if (!history || phase === "paused") return;
    ({ board, score, moves, reached, keepPlaying } = history);
    history = null;
    phase = "playing";
    merged = [];
    say("Ostatni ruch cofnięty.");
    render();
  }
  function pause() {
    if (phase !== "playing") return;
    pointer = null;
    beforePause = phase;
    phase = "paused";
    render();
  }
  function resume() {
    if (phase === "paused") phase = beforePause;
    else if (phase === "won") {
      keepPlaying = true;
      phase = hasMoves(board) ? "playing" : "over";
    }
    render();
    grid.focus({ preventScroll: true });
  }
  $("tiles-new").onclick = $("tiles-again").onclick = newGame;
  $("tiles-undo").onclick = undo;
  $("tiles-pause").onclick = () => (phase === "paused" ? resume() : pause());
  $("tiles-continue").onclick = resume;
  document
    .querySelectorAll("[data-direction]")
    .forEach((button) => press(button, () => move(button.dataset.direction)));
  document.addEventListener("keydown", (event) => {
    if (editing(event)) return;
    const direction = keys[event.key] || keys[event.key.toLowerCase()];
    if (direction) {
      event.preventDefault();
      move(direction);
    } else if (event.key.toLowerCase() === "u") {
      event.preventDefault();
      undo();
    } else if (!event.repeat && event.key.toLowerCase() === "p") {
      event.preventDefault();
      phase === "paused" ? resume() : pause();
    }
  });
  let pointer = null;
  grid.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    grid.setPointerCapture(event.pointerId);
  });
  grid.addEventListener("pointerup", (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= 22)
      move(
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up",
      );
  });
  grid.addEventListener("pointercancel", () => (pointer = null));
  grid.addEventListener("lostpointercapture", () => (pointer = null));
  pauses(pause);
  window.addEventListener("spinner:preferences-cleared", () => {
    best = 0;
    render();
  });
  window.SpinnerGame = { render, pause };
  window.TilesGame = {
    move,
    newGame,
    undo,
    transform,
    hasMoves,
    snapshot: () => ({ board: [...board], score, moves, best, phase }),
  };
  newGame();
})();
