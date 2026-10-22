/* Turn handling for four different rule sets. Search understands extra turns. */
(() => {
  "use strict";
  const copy = (s) => JSON.parse(JSON.stringify(s));
  function search(
    state,
    depth,
    root,
    rules,
    alpha = -Infinity,
    beta = Infinity,
  ) {
    const outcome = rules.result(state);
    if (outcome !== null)
      return outcome === 0 ? 0 : outcome === root ? 1e6 + depth : -1e6 - depth;
    if (!depth) return rules.evaluate(state, root);
    const maximize = state.turn === root;
    let value = maximize ? -Infinity : Infinity;
    for (const move of rules.legal(state)) {
      const score = search(
        rules.apply(state, move),
        depth - 1,
        root,
        rules,
        alpha,
        beta,
      );
      value = maximize ? Math.max(value, score) : Math.min(value, score);
      if (maximize) alpha = Math.max(alpha, value);
      else beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }
  function create(H, rules) {
    let state,
      history = [],
      due = 0,
      mode = "cpu",
      difficulty = "hard";
    const opponent = H.select(
      "RYWAL",
      [
        ["cpu", "Komputer"],
        ["local", "Druga osoba"],
      ],
      (v) => {
        mode = v;
        newGame();
      },
    );
    const level = H.select(
      "KOMPUTER",
      [
        ["hard", "Skupiony"],
        ["easy", "Spokojny"],
      ],
      (v) => {
        difficulty = v;
        newGame();
      },
    );
    const undoButton = H.button("Cofnij", undo);
    const cpuTurn = () => mode === "cpu" && state.turn === 2;
    function render() {
      rules.draw(state, (move) => play(move));
      H.stats([
        ["won", "lost"].includes(H.phase)
          ? "Koniec"
          : `Gracz ${state.turn === 1 ? "I" : "II"}`,
        ...rules.scores(state),
      ]);
      undoButton.disabled = !history.length || H.phase === "paused";
      level.disabled = mode === "local";
    }
    function newGame() {
      state = rules.initial();
      history = [];
      due = 0;
      H.reset();
      H.say(
        "Zaczyna gracz I. " +
          (mode === "cpu"
            ? "Komputer gra jako II."
            : "Grajcie na zmianę na jednym urządzeniu."),
      );
      render();
    }
    function play(move, computer = false) {
      if (
        !H.active() ||
        cpuTurn() !== computer ||
        !rules.legal(state).includes(move)
      )
        return false;
      H.start();
      history.push(copy(state));
      state = rules.apply(state, move);
      const outcome = rules.result(state);
      if (outcome !== null) {
        H.finish(
          outcome === 0
            ? "Remis. Dobra partia!"
            : `Wygrywa ${outcome === 2 && mode === "cpu" ? "komputer" : "gracz " + (outcome === 1 ? "I" : "II")}!`,
          outcome === 0 || outcome === 1 || mode === "local",
        );
      } else {
        due = H.elapsed + 300;
        H.say(
          (state.notice ? state.notice + " " : "") +
            (cpuTurn()
              ? "Komputer wybiera ruch…"
              : `Ruch gracza ${state.turn === 1 ? "I" : "II"}.`),
        );
      }
      render();
      return true;
    }
    function choose(
      position = state,
      depth = difficulty === "hard"
        ? rules.depth
        : Math.max(1, rules.depth - 2),
    ) {
      let best = -Infinity,
        selected = null;
      for (const move of rules.legal(position)) {
        const value = search(
          rules.apply(position, move),
          depth - 1,
          position.turn,
          rules,
        );
        if (value > best) {
          best = value;
          selected = move;
        }
      }
      return selected;
    }
    function undo() {
      if (!history.length || H.phase === "paused") return;
      state = history.pop();
      while (mode === "cpu" && state.turn === 2 && history.length)
        state = history.pop();
      H.reopen();
      due = H.elapsed + 300;
      H.say("Ruch cofnięty. Spróbuj innego planu.");
      render();
    }
    H.onRender = render;
    H.onNew = newGame;
    H.onTick = () => {
      if (cpuTurn() && H.elapsed >= due) play(choose(), true);
    };
    H.keys((key, e) => {
      if (key.toLowerCase() === "u" && !e.repeat) {
        undo();
        return true;
      }
    });
    window.MoreGame = {
      newGame,
      move: play,
      undo,
      choose,
      rules,
      snapshot: () => ({
        ...copy(state),
        phase: H.phase,
        history: history.length,
        mode,
        elapsed: H.elapsed,
      }),
    };
    newGame();
    return window.MoreGame;
  }
  window.SpinnerTurn = { create, search };
})();
