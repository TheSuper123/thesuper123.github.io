(() => {
  "use strict";
  const { prefs, shuffle, clock, time, editing, pauses } = SpinnerNew;
  const $ = (id) => document.getElementById(id),
    grid = $("board"),
    timer = clock(),
    ALL = 0b1111111110;
  const row = (i) => Math.floor(i / 9),
    col = (i) => i % 9,
    box = (i) => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);
  const peers = (a, b) =>
    a !== b && (row(a) === row(b) || col(a) === col(b) || box(a) === box(b));
  let puzzle,
    solution,
    values,
    notes,
    selected = 0,
    history = [],
    hints = 0,
    noteMode = false,
    phase = "ready",
    level = "normal";
  function countSolutions(input, limit = 2) {
    if (!Array.isArray(input) || input.length !== 81) return 0;
    const copy = [...input],
      rows = Array(9).fill(0),
      cols = Array(9).fill(0),
      boxes = Array(9).fill(0);
    let count = 0;
    for (let i = 0; i < 81; i++) {
      const value = copy[i];
      if (!Number.isInteger(value) || value < 0 || value > 9) return 0;
      if (!value) continue;
      const bit = 1 << value,
        r = row(i),
        c = col(i),
        b = box(i);
      if ((rows[r] | cols[c] | boxes[b]) & bit) return 0;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
    }
    const search = () => {
      let chosen = -1,
        mask = 0,
        size = 10;
      for (let i = 0; i < 81; i++) {
        if (copy[i]) continue;
        const candidates = ALL & ~(rows[row(i)] | cols[col(i)] | boxes[box(i)]);
        if (!candidates) return;
        let n = 0;
        for (let bits = candidates; bits; bits &= bits - 1) n++;
        if (n < size) {
          chosen = i;
          mask = candidates;
          size = n;
          if (n === 1) break;
        }
      }
      if (chosen === -1) {
        count++;
        return;
      }
      const r = row(chosen),
        c = col(chosen),
        b = box(chosen);
      for (let digit = 1; digit <= 9; digit++) {
        const bit = 1 << digit;
        if (!(mask & bit)) continue;
        copy[chosen] = digit;
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[b] |= bit;
        search();
        copy[chosen] = 0;
        rows[r] &= ~bit;
        cols[c] &= ~bit;
        boxes[b] &= ~bit;
        if (count >= limit) return;
      }
    };
    search();
    return count;
  }
  function generate(difficulty) {
    const groups = () =>
      shuffle([0, 1, 2]).flatMap((group) =>
        shuffle([0, 1, 2]).map((n) => group * 3 + n),
      );
    const rows = groups(),
      cols = groups(),
      digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const solved = Array.from(
      { length: 81 },
      (_, i) =>
        digits[
          (rows[row(i)] * 3 + Math.floor(rows[row(i)] / 3) + cols[col(i)]) % 9
        ],
    );
    const board = [...solved],
      target = { easy: 41, normal: 34, hard: 29 }[difficulty] || 34;
    let clues = 81;
    for (const index of shuffle(Array.from({ length: 81 }, (_, i) => i))) {
      if (clues <= target) break;
      const previous = board[index];
      board[index] = 0;
      if (countSolutions(board) === 1) clues--;
      else board[index] = previous;
    }
    return { puzzle: board, solution: solved };
  }
  function record() {
    const saved = prefs.get("new:sudoku:best:" + level, null);
    return Number.isFinite(saved) && saved >= 0 ? saved : null;
  }
  function say(text, result = "") {
    $("sudoku-status").textContent = text;
    $("sudoku-status").dataset.result = result;
  }
  function stats() {
    $("sudoku-time").textContent = time(timer.elapsed);
    $("sudoku-filled").textContent = values.filter(Boolean).length + " / 81";
    $("sudoku-hints").textContent = hints;
    const best = record();
    $("sudoku-record").textContent =
      best === null
        ? "Rekord czasu zapisujemy za ukończenie bez podpowiedzi."
        : "Najlepszy czas bez pomocy: " + time(best);
  }
  function render() {
    const hadFocus = grid.contains(document.activeElement),
      current = values[selected];
    grid.replaceChildren(
      ...values.map((value, index) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "sudoku-cell";
        cell.dataset.index = index;
        cell.dataset.fixed = String(Boolean(puzzle[index]));
        cell.dataset.selected = String(index === selected);
        cell.dataset.peer = String(peers(index, selected));
        cell.dataset.same = String(Boolean(value) && value === current);
        cell.dataset.right = String(col(index) === 2 || col(index) === 5);
        cell.dataset.bottom = String(row(index) === 2 || row(index) === 5);
        cell.tabIndex = index === selected ? 0 : -1;
        const conflict =
          Boolean(value) &&
          values.some((other, i) => other === value && peers(i, index));
        cell.dataset.conflict = String(conflict);
        cell.setAttribute("aria-invalid", String(conflict));
        let description = `Wiersz ${row(index) + 1}, kolumna ${col(index) + 1}: ${value || "puste"}`;
        if (puzzle[index]) description += ", podana cyfra";
        if (!value && notes[index])
          description +=
            ", notatki " +
            Array.from({ length: 9 }, (_, n) => n + 1)
              .filter((n) => notes[index] & (1 << n))
              .join(", ");
        cell.setAttribute("aria-label", description);
        if (value) cell.textContent = value;
        else if (notes[index]) {
          const small = document.createElement("span");
          small.className = "sudoku-notes";
          small.setAttribute("aria-hidden", "true");
          for (let n = 1; n <= 9; n++) {
            const entry = document.createElement("span");
            entry.textContent = notes[index] & (1 << n) ? n : "";
            small.append(entry);
          }
          cell.append(small);
        }
        cell.onclick = () => select(index);
        return cell;
      }),
    );
    $("sudoku-undo").disabled =
      !history.length || phase === "paused" || phase === "won";
    $("sudoku-note").setAttribute("aria-pressed", String(noteMode));
    for (const id of [
      "sudoku-note",
      "sudoku-erase",
      "sudoku-hint",
      "sudoku-check",
    ])
      $(id).disabled = phase === "paused" || phase === "won";
    document
      .querySelectorAll("[data-digit]")
      .forEach(
        (button) => (button.disabled = phase === "paused" || phase === "won"),
      );
    $("sudoku-pause").textContent = phase === "paused" ? "Wznów" : "Pauza";
    $("sudoku-pause").disabled = phase === "won";
    $("sudoku-cover").hidden = phase !== "paused" && phase !== "won";
    $("sudoku-cover-title").textContent =
      phase === "won" ? "Wszystkie cyfry pasują." : "Cyfry zaczekają.";
    $("sudoku-cover-copy").textContent =
      phase === "won"
        ? `${time(timer.elapsed)} · podpowiedzi: ${hints}. ${hints ? "Spróbuj następnej planszy bez pomocy." : "Plansza rozwiązana samodzielnie."}`
        : "Plansza jest zasłonięta, a zegar zatrzymany.";
    $("sudoku-resume").textContent = phase === "won" ? "Nowa plansza" : "Wznów";
    stats();
    if (hadFocus && phase !== "paused" && phase !== "won")
      grid.children[selected]?.focus({ preventScroll: true });
  }
  function select(index) {
    if (phase === "paused" || phase === "won" || index < 0 || index > 80)
      return;
    selected = index;
    render();
    grid.children[selected]?.focus({ preventScroll: true });
  }
  function checkpoint() {
    history.push({ values: [...values], notes: [...notes] });
    if (history.length > 300) history.shift();
  }
  function begin() {
    if (phase === "ready") {
      phase = "playing";
      timer.start();
    }
  }
  function complete() {
    if (!values.every((value, i) => value === solution[i])) return false;
    phase = "won";
    timer.stop();
    const best = record();
    if (!hints && (best === null || timer.elapsed < best))
      prefs.set("new:sudoku:best:" + level, Math.round(timer.elapsed));
    say("Każdy wiersz, kolumna i kwadrat są kompletne.", "win");
    return true;
  }
  function enter(digit) {
    if (
      !["playing", "ready"].includes(phase) ||
      puzzle[selected] ||
      !Number.isInteger(digit) ||
      digit < 1 ||
      digit > 9
    )
      return false;
    if (!noteMode && values[selected] === digit) return false;
    begin();
    checkpoint();
    if (noteMode) {
      if (values[selected]) {
        history.pop();
        return false;
      }
      notes[selected] ^= 1 << digit;
      say("Notatka w wybranym polu zmieniona.");
    } else {
      values[selected] = digit;
      notes[selected] = 0;
      for (let i = 0; i < 81; i++)
        if (peers(i, selected)) notes[i] &= ~(1 << digit);
      say("Cyfra wpisana. Podświetlone pola pomagają sprawdzić jej sąsiadów.");
      complete();
    }
    render();
    return true;
  }
  function erase() {
    if (
      !["playing", "ready"].includes(phase) ||
      puzzle[selected] ||
      (!values[selected] && !notes[selected])
    )
      return;
    begin();
    checkpoint();
    values[selected] = 0;
    notes[selected] = 0;
    say("Pole wyczyszczone.");
    render();
  }
  function undo() {
    if (!history.length || !["ready", "playing"].includes(phase)) return;
    const previous = history.pop();
    values = previous.values;
    notes = previous.notes;
    say("Ostatni wpis cofnięty.");
    render();
  }
  function hint() {
    if (!["ready", "playing"].includes(phase)) return;
    let index =
      !puzzle[selected] && values[selected] !== solution[selected]
        ? selected
        : values.findIndex((value, i) => value !== solution[i]);
    if (index < 0) return;
    begin();
    checkpoint();
    selected = index;
    values[index] = solution[index];
    notes[index] = 0;
    hints++;
    say(
      `Podpowiedź: wiersz ${row(index) + 1}, kolumna ${col(index) + 1} ma cyfrę ${solution[index]}.`,
    );
    complete();
    render();
  }
  function check() {
    if (!["ready", "playing"].includes(phase)) return;
    const wrong = values.reduce(
      (sum, value, i) => sum + Number(Boolean(value) && value !== solution[i]),
      0,
    );
    say(
      wrong
        ? `Wpisy wymagające poprawy: ${wrong}. Możesz je wymazać lub cofnąć.`
        : "Dotychczasowe cyfry są poprawne. Uzupełnij pozostałe pola.",
      wrong ? "error" : "",
    );
  }
  function newGame() {
    level = $("sudoku-level").value;
    if (!["easy", "normal", "hard"].includes(level)) level = "normal";
    ({ puzzle, solution } = generate(level));
    values = [...puzzle];
    notes = Array(81).fill(0);
    selected = puzzle.findIndex((value) => !value);
    history = [];
    hints = 0;
    noteMode = false;
    phase = "ready";
    timer.reset();
    say("Wybierz pole. Zegar ruszy przy pierwszym wpisie.");
    render();
  }
  function pause() {
    if (phase !== "playing") return;
    timer.stop();
    phase = "paused";
    render();
  }
  function resume() {
    if (phase === "won") {
      newGame();
      return;
    }
    if (phase !== "paused") return;
    phase = "playing";
    timer.start();
    render();
    grid.children[selected]?.focus({ preventScroll: true });
  }
  $("sudoku-new").onclick = newGame;
  $("sudoku-level").onchange = newGame;
  $("sudoku-pause").onclick = () => (phase === "paused" ? resume() : pause());
  $("sudoku-resume").onclick = resume;
  $("sudoku-erase").onclick = erase;
  $("sudoku-undo").onclick = undo;
  $("sudoku-hint").onclick = hint;
  $("sudoku-check").onclick = check;
  $("sudoku-note").onclick = () => {
    noteMode = !noteMode;
    render();
  };
  document
    .querySelectorAll("[data-digit]")
    .forEach(
      (button) => (button.onclick = () => enter(Number(button.dataset.digit))),
    );
  document.addEventListener("keydown", (event) => {
    if (
      event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      event.key.toLowerCase() === "z" &&
      !event.target.closest("input,textarea,select")
    ) {
      event.preventDefault();
      undo();
      return;
    }
    if (editing(event)) return;
    const key = event.key.toLowerCase(),
      delta = { arrowleft: -1, arrowright: 1, arrowup: -9, arrowdown: 9 }[key];
    if (delta) {
      event.preventDefault();
      select((selected + delta + 81) % 81);
    } else if (/^[1-9]$/.test(key)) {
      event.preventDefault();
      enter(Number(key));
    } else if (key === "backspace" || key === "delete" || key === "0") {
      event.preventDefault();
      erase();
    } else if (key === "u") {
      event.preventDefault();
      undo();
    } else if (
      !event.repeat &&
      key === "n" &&
      phase !== "won" &&
      phase !== "paused"
    ) {
      event.preventDefault();
      noteMode = !noteMode;
      render();
    } else if (!event.repeat && key === "p") {
      event.preventDefault();
      phase === "paused" ? resume() : pause();
    }
  });
  setInterval(() => {
    if (phase === "playing") stats();
  }, 250);
  pauses(pause);
  window.addEventListener("spinner:preferences-cleared", stats);
  window.SpinnerGame = { render, pause };
  window.SudokuGame = {
    generate,
    countSolutions,
    enter,
    select,
    undo,
    newGame,
    snapshot: () => ({
      puzzle: [...puzzle],
      values: [...values],
      notes: [...notes],
      selected,
      hints,
      phase,
      elapsed: timer.elapsed,
    }),
  };
  newGame();
})();
