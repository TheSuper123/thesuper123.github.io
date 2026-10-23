(() => {
  "use strict";
  const S = SpinnerHundred,
    H = S.create(["RUCHY", "CZAS", "WYJŚCIE"]),
    n = 6;
  let state,
    history = [],
    selected = 0;
  function occupied(cars) {
    const board = Array(36).fill(-1);
    cars.forEach((c, k) => {
      for (let j = 0; j < c.len; j++)
        board[(c.y + (c.v ? j : 0)) * 6 + c.x + (c.v ? 0 : j)] = k;
    });
    return board;
  }
  function legal(cars, k, delta) {
    if (!Number.isInteger(k) || !cars[k] || !Number.isInteger(delta) || !delta)
      return false;
    const c = cars[k],
      b = occupied(cars),
      direction = Math.sign(delta);
    for (let step = 1; step <= Math.abs(delta); step++) {
      const x = c.x + (c.v ? 0 : direction * step),
        y = c.y + (c.v ? direction * step : 0);
      if (
        x < 0 ||
        y < 0 ||
        x + (c.v ? 1 : c.len) > 6 ||
        y + (c.v ? c.len : 1) > 6
      )
        return false;
      for (let j = 0; j < c.len; j++) {
        const id = (y + (c.v ? j : 0)) * 6 + x + (c.v ? 0 : j);
        if (b[id] >= 0 && b[id] !== k) return false;
      }
    }
    return true;
  }
  const shift = (cars, k, d) => {
    cars[k][cars[k].v ? "y" : "x"] += d;
  };
  function move(k, delta) {
    if (!H.active() || !legal(state.cars, k, delta)) return false;
    history.push(S.clone(state));
    H.start();
    shift(state.cars, k, delta);
    state.moves++;
    state.board = occupied(state.cars);
    if (state.cars[0].x === 4)
      H.finish("Wyjazd wolny. Czerwony samochód dotarł do wyjścia!");
    else {
      H.say("Przesuwaj samochody wyłącznie wzdłuż ich osi.");
      H.render();
    }
    return true;
  }
  function undo() {
    if (!history.length || H.phase === "paused") return false;
    state = history.pop();
    H.reopen();
    H.render();
    return true;
  }
  H.button("Cofnij", undo);
  for (const [d, label] of [
    [-1, "← / ↑"],
    [1, "→ / ↓"],
  ])
    H.button(label, () => move(selected, d), H.extra);
  H.onRender = () => {
    H.stats([state.moves, S.time(H.elapsed), "→"]);
    H.grid(
      6,
      state.board.map((v) => (v < 0 ? "" : v === 0 ? "→" : String(v + 1))),
      (i) => {
        const k = state.board[i];
        if (k >= 0) {
          selected = k;
          H.render();
        } else {
          const c = state.cars[selected],
            d = c.v ? Math.floor(i / 6) - c.y : (i % 6) - c.x;
          if (d > 0) move(selected, d - c.len + 1);
          else move(selected, d);
        }
      },
      (b, i) => {
        const k = state.board[i];
        b.dataset.selected = String(k === selected);
        if (k === 0) b.classList.add("hu-rush-target");
        else if (k >= 0)
          b.style.background = `color-mix(in srgb,var(--paper) ${90 - k * 5}%,var(--ink))`;
      },
    );
  };
  H.onTick = () => H.stats([state.moves, S.time(H.elapsed), "→"]);
  H.onNew = () => {
    let cars, certificate;
    do {
      cars = [
        { x: 4, y: 2, len: 2, v: false },
        { x: 3, y: 0, len: 3, v: true },
        { x: 2, y: 3, len: 3, v: true },
        { x: 0, y: 3, len: 2, v: false },
        { x: 4, y: 4, len: 2, v: false },
        { x: 5, y: 0, len: 2, v: true },
        { x: 0, y: 0, len: 3, v: false },
        { x: 0, y: 4, len: 2, v: true },
      ];
      certificate = [];
      for (let step = 0; step < 180; step++) {
        const moves = [];
        for (let k = 0; k < cars.length; k++)
          for (const d of [-1, 1]) if (legal(cars, k, d)) moves.push([k, d]);
        if (!moves.length) break;
        const [k, d] = S.shuffle(moves)[0];
        shift(cars, k, d);
        certificate.unshift([k, -d]);
      }
    } while (cars[0].x === 4);
    state = { cars, board: occupied(cars), moves: 0, certificate };
    history = [];
    selected = 0;
    H.reset();
    H.say("Wypuść czerwony samochód prawą stroną trzeciego rzędu.");
  };
  H.keys((k, e) => {
    if (e.repeat) return false;
    if (k.toLowerCase() === "u") {
      undo();
      return true;
    }
    const c = state.cars[selected],
      d = (
        c.v ? { ArrowUp: -1, ArrowDown: 1 } : { ArrowLeft: -1, ArrowRight: 1 }
      )[k];
    if (d) {
      move(selected, d);
      return true;
    }
  });
  S.api(H, { move, undo, legal, occupied, getState: () => state }, () => state);
  H.onNew();
})();
