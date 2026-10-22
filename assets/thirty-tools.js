(() => {
  "use strict";
  const S = window.SpinnerMore,
    clone = (value) => JSON.parse(JSON.stringify(value));
  function api(H, methods, state) {
    window.MoreGame = {
      newGame: () => H.onNew(),
      begin: () => {
        if (H.active()) H.start();
      },
      ...methods,
      snapshot: () => ({
        ...clone(state()),
        phase: H.phase,
        elapsed: H.elapsed,
      }),
    };
    return window.MoreGame;
  }
  function pad(H, n, enter) {
    const bar = document.createElement("div");
    bar.className = "th-digit-pad";
    H.extra.append(bar);
    for (let i = 1; i <= n; i++) H.button(String(i), () => enter(i), bar);
    H.button("×", () => enter(0), bar);
    H.keys((key, e) => {
      if (e.repeat) return false;
      if (/^[1-9]$/.test(key) && Number(key) <= n) {
        enter(Number(key));
        return true;
      }
      if (["Backspace", "Delete"].includes(key)) {
        enter(0);
        return true;
      }
    });
    return bar;
  }
  const rank = (c) => (c % 13) + 1,
    suit = (c) => Math.floor(c / 13),
    red = (c) => [1, 2].includes(suit(c));
  const faces = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ],
    signs = ["♠", "♥", "♦", "♣"];
  function card(c) {
    return `<span class="th-card-rank">${faces[rank(c) - 1]}</span><span class="th-card-suit">${signs[suit(c)]}</span>`;
  }
  function cardButton(H, c, action, parent, hidden = false) {
    const b = H.button("", action, parent, "th-card");
    b.innerHTML = hidden ? '<span aria-hidden="true">✳</span>' : card(c);
    b.dataset.red = String(!hidden && red(c));
    b.dataset.back = String(hidden);
    b.setAttribute(
      "aria-label",
      hidden
        ? "Zakryta karta"
        : faces[rank(c) - 1] + " " + ["pik", "kier", "karo", "trefl"][suit(c)],
    );
    return b;
  }
  function undo(H, history, restore) {
    if (!history.length || H.phase === "paused") return false;
    restore(history.pop());
    H.reopen();
    H.render();
    return true;
  }
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lines = (b, n) => [
    ...Array.from({ length: n }, (_, r) => b.slice(r * n, r * n + n)),
    ...Array.from({ length: n }, (_, c) =>
      Array.from({ length: n }, (_, r) => b[r * n + c]),
    ),
  ];
  const latin = (b, n) =>
    lines(b, n).every(
      (row) => row.every((v) => v >= 1 && v <= n) && new Set(row).size === n,
    );
  function latinBoard(n) {
    const rows = S.shuffle(Array.from({ length: n }, (_, i) => i)),
      cols = S.shuffle(Array.from({ length: n }, (_, i) => i)),
      digits = S.shuffle(Array.from({ length: n }, (_, i) => i + 1));
    return rows.flatMap((r) => cols.map((c) => digits[(r + c) % n]));
  }
  function motion(H, width = 720, height = 480) {
    const keys = new Set(),
      view = H.canvas(width, height),
      bindings = {};
    H.onPause = () => keys.clear();
    const bind = (label, key, codes) => {
      H.hold(label, key, keys);
      for (const code of codes) bindings[code] = key;
    };
    H.keys((key, e) => {
      if (!bindings[key]) return false;
      H.start();
      keys.add(bindings[key]);
      return true;
    });
    document.addEventListener("keyup", (e) => {
      if (bindings[e.key]) keys.delete(bindings[e.key]);
    });
    return { ...view, keys, bind };
  }
  function advance(H, update, dt) {
    let left = Math.max(0, Math.min(60, dt));
    while (left > 0 && H.phase === "playing") {
      const step = Math.min(1 / 120, left);
      update(step);
      left -= step;
    }
  }
  window.SpinnerThirty = {
    ...S,
    clone,
    api,
    pad,
    rank,
    suit,
    red,
    card,
    cardButton,
    undo,
    clamp,
    lines,
    latin,
    latinBoard,
    motion,
    advance,
  };
})();
