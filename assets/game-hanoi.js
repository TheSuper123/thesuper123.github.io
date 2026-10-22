(() => {
  "use strict";
  const H = SpinnerMore.create(["CZAS", "RUCHY", "MINIMUM OD STARTU"]);
  H.board.className = "mo-hanoi";
  let count = 4,
    towers = [[], [], []],
    selected = -1,
    moves = 0,
    history = [];
  H.select(
    "KRĄŻKI",
    [
      [4, "4 krążki"],
      [3, "3 krążki"],
      [5, "5 krążków"],
      [6, "6 krążków"],
      [7, "7 krążków"],
    ],
    (v) => {
      count = Number(v);
      newGame();
    },
  );
  const undoButton = H.button("Cofnij", undo);
  H.button("Wskazówka", hint);
  function newGame() {
    towers = [Array.from({ length: count }, (_, i) => count - i), [], []];
    selected = -1;
    moves = 0;
    history = [];
    H.reset();
    H.record("hanoi:" + count);
    H.say("Przenieś stos na prawą wieżę. Wybierz źródło i cel.");
    render();
  }
  function move(from, to) {
    if (
      !H.active() ||
      ![0, 1, 2].includes(from) ||
      ![0, 1, 2].includes(to) ||
      from === to ||
      !towers[from].length
    )
      return false;
    const disk = towers[from].at(-1);
    if (towers[to].length && towers[to].at(-1) < disk) {
      H.say("Większy krążek nie może leżeć na mniejszym.");
      return false;
    }
    H.start();
    history.push(towers.map((t) => [...t]));
    towers[to].push(towers[from].pop());
    moves++;
    selected = -1;
    if (towers[2].length === count) {
      H.record("hanoi:" + count, moves, true);
      H.finish(
        `Stos na miejscu. ${moves} ruchów; minimum od startu to ${2 ** count - 1}.`,
      );
    }
    render();
    return true;
  }
  function choose(i) {
    if (!H.active()) return;
    if (selected < 0) {
      if (towers[i].length) selected = i;
    } else if (selected === i) selected = -1;
    else if (!move(selected, i) && towers[i].length) selected = i;
    render();
  }
  function undo() {
    if (!history.length || H.phase === "paused") return;
    towers = history.pop();
    moves--;
    selected = -1;
    H.reopen();
    render();
  }
  function nextMove(position, n = count, goal = 2) {
    if (!n) return null;
    const source = position.findIndex((t) => t.includes(n));
    if (source === goal) return nextMove(position, n - 1, goal);
    const spare = 3 - source - goal,
      small = nextMove(position, n - 1, spare);
    return small || [source, goal];
  }
  function hint() {
    if (!H.active()) return;
    const next = nextMove(towers);
    if (next) {
      selected = next[0];
      H.say(
        `Przenieś wierzchni krążek z wieży ${next[0] + 1} na ${next[1] + 1}.`,
      );
      render();
    }
  }
  function render() {
    const had = H.board.contains(document.activeElement),
      focus = document.activeElement?.dataset.tower;
    H.board.replaceChildren(
      ...towers.map((tower, i) => {
        const b = document.createElement("button");
        b.className = "mo-tower";
        b.type = "button";
        b.dataset.tower = i;
        b.dataset.selected = String(selected === i);
        b.setAttribute(
          "aria-label",
          `Wieża ${i + 1}: ${tower.length ? tower.join(", ") : "pusta"}`,
        );
        for (const disk of [...tower].reverse()) {
          const span = document.createElement("span");
          span.className = "mo-ring";
          span.style.width = `${30 + (disk / count) * 68}%`;
          span.style.background =
            disk % 2 ? "var(--orange)" : "var(--game-green)";
          span.textContent = disk;
          b.append(span);
        }
        b.onclick = () => choose(i);
        return b;
      }),
    );
    if (had)
      H.board
        .querySelector(`[data-tower="${focus}"]`)
        ?.focus({ preventScroll: true });
    H.stats([SpinnerMore.time(H.elapsed), moves, 2 ** count - 1]);
    undoButton.disabled = !history.length || H.phase === "paused";
  }
  H.keys((key, e) => {
    if (/^[1-3]$/.test(key) && !e.repeat) {
      choose(Number(key) - 1);
      return true;
    }
    if (key.toLowerCase() === "u" && !e.repeat) {
      undo();
      return true;
    }
  });
  H.onRender = render;
  H.onNew = newGame;
  H.onTick = () =>
    H.stats([SpinnerMore.time(H.elapsed), moves, 2 ** count - 1]);
  window.MoreGame = {
    newGame,
    move,
    choose,
    undo,
    nextMove,
    snapshot: () => ({
      towers: towers.map((t) => [...t]),
      count,
      moves,
      selected,
      phase: H.phase,
    }),
  };
  newGame();
})();
