(() => {
  "use strict";
  const S = SpinnerHundred,
    H = S.create(["FIGURY", "RUCHY", "CEL"]);
  let state,
    history = [],
    selected = 0,
    rotation = 0,
    flipped = false;
  function shape(piece, rot = rotation, flip = flipped) {
    let cells = piece.map(([x, y]) => [flip ? -x : x, y]);
    for (let k = 0; k < rot; k++) cells = cells.map(([x, y]) => [-y, x]);
    const minx = Math.min(...cells.map((c) => c[0])),
      miny = Math.min(...cells.map((c) => c[1]));
    return cells.map(([x, y]) => [x - minx, y - miny]);
  }
  function place(i, k = selected, rot = rotation, flip = flipped) {
    if (!H.active() || !Number.isInteger(i) || i < 0 || i >= 30) return false;
    const cells = shape(state.pieces[k], rot, flip),
      x = i % 6,
      y = Math.floor(i / 6),
      ids = cells.map(([a, b]) => (y + b) * 6 + x + a);
    if (
      cells.some(([a, b]) => x + a >= 6 || y + b >= 5) ||
      ids.some((j) => state.board[j] >= 0 && state.board[j] !== k)
    )
      return false;
    history.push(S.clone(state));
    state.board = state.board.map((v) => (v === k ? -1 : v));
    for (const j of ids) state.board[j] = k;
    H.start();
    state.moves++;
    if (state.board.every((v) => v >= 0))
      H.finish("Sześć figur. Trzydzieści pól. Wszystko pasuje!");
    else {
      H.say("Obróć lub odbij wybraną figurę. Kliknij jej lewy górny narożnik.");
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
  H.button(
    "Obróć ↻",
    () => {
      rotation = (rotation + 1) % 4;
      H.render();
    },
    H.extra,
  );
  H.button(
    "Odbij ↔",
    () => {
      flipped = !flipped;
      H.render();
    },
    H.extra,
  );
  const rack = document.createElement("div");
  rack.className = "hu-rack";
  H.extra.append(rack);
  H.onRender = () => {
    H.stats([
      new Set(state.board.filter((v) => v >= 0)).size + " / 6",
      state.moves,
      "6 × 5",
    ]);
    rack.replaceChildren();
    state.pieces.forEach((p, k) => {
      const b = H.button(
        String(k + 1),
        () => {
          selected = k;
          rotation = 0;
          flipped = false;
          H.render();
        },
        rack,
      );
      b.setAttribute("aria-pressed", String(k === selected));
      b.title = p.map((c) => c.join(",")).join("; ");
    });
    const p = shape(state.pieces[selected]),
      preview = p.map(([x, y]) => `${x + 1},${y + 1}`).join(" · ");
    rack.setAttribute("aria-label", `Figura ${selected + 1}, pola ${preview}`);
    H.grid(
      6,
      state.board.map((v) => (v < 0 ? "" : v + 1)),
      (i) => place(i),
      (b, i) => {
        const v = state.board[i];
        if (v >= 0)
          b.style.background = `color-mix(in srgb,var(--paper) ${88 - v * 8}%,var(--accent))`;
      },
    );
    const b = rack.children[selected];
    b.innerHTML =
      String(selected + 1) +
      `<svg viewBox="0 0 50 50" width="36" height="36" aria-hidden="true">${p.map(([x, y]) => `<rect x="${x * 9 + 2}" y="${y * 9 + 2}" width="8" height="8" fill="currentColor"/>`).join("")}</svg>`;
  };
  H.onNew = () => {
    const rows = 5,
      cols = 6;
    let path = Array.from({ length: 30 }, (_, k) => {
      const r = Math.floor(k / cols);
      return r * cols + (r % 2 ? cols - 1 - (k % cols) : k % cols);
    });
    for (let k = 0; k < 150; k++) {
      if (Math.random() < 0.5) path.reverse();
      const end = path.at(-1),
        near = path
          .slice(0, -2)
          .flatMap((i, j) =>
            Math.abs(Math.floor(i / cols) - Math.floor(end / cols)) +
              Math.abs((i % cols) - (end % cols)) ===
            1
              ? [j]
              : [],
          );
      if (near.length) {
        const j = S.shuffle(near)[0];
        path = [...path.slice(0, j + 1), ...path.slice(j + 1).reverse()];
      }
    }
    const pieces = [],
      solution = [];
    for (let k = 0; k < 6; k++) {
      const cells = path.slice(k * 5, k * 5 + 5),
        x = Math.min(...cells.map((i) => i % cols)),
        y = Math.min(...cells.map((i) => Math.floor(i / cols)));
      pieces.push(cells.map((i) => [(i % cols) - x, Math.floor(i / cols) - y]));
      solution.push({ i: y * cols + x, k });
    }
    state = { board: Array(rows * cols).fill(-1), pieces, solution, moves: 0 };
    history = [];
    selected = rotation = 0;
    flipped = false;
    H.reset();
    H.say("Wybierz figurę, ustaw obrót i połóż ją na planszy.");
  };
  S.api(H, { place, undo, shape, getState: () => state }, () => state);
  H.onNew();
})();
