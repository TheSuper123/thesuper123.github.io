(() => {
  "use strict";
  const S = SpinnerHundred;
  let selected = null;
  const sign = (p) => (p === 1 ? 1 : -1);
  function roll() {
    const a = 1 + Math.floor(Math.random() * 6),
      b = 1 + Math.floor(Math.random() * 6);
    return a === b ? [a, a, a, a] : [a, b];
  }
  function raw(s, d) {
    const p = s.turn,
      sgn = sign(p),
      out = [],
      home = p === 1 ? 18 : 0;
    if (s.bar[p - 1]) {
      const to = p === 1 ? d - 1 : 24 - d;
      if (s.board[to] * sgn >= -1) out.push([-1, d]);
      return out;
    }
    const inside = s.board.every(
      (v, i) => v * sgn <= 0 || (p === 1 ? i >= home : i < 6),
    );
    for (let i = 0; i < 24; i++)
      if (s.board[i] * sgn > 0) {
        const to = i + sgn * d;
        if (to >= 0 && to < 24) {
          if (s.board[to] * sgn >= -1) out.push([i, d]);
        } else if (inside) {
          const exact = p === 1 ? to === 24 : to === -1,
            farther = s.board.some(
              (v, j) => v * sgn > 0 && (p === 1 ? j < i : j > i),
            );
          if (exact || !farther) out.push([i, d]);
        }
      }
    return out;
  }
  function step(s, [from, d]) {
    const t = S.clone(s),
      p = s.turn,
      sgn = sign(p),
      to = from === -1 ? (p === 1 ? d - 1 : 24 - d) : from + sgn * d;
    if (from === -1) t.bar[p - 1]--;
    else t.board[from] -= sgn;
    if (to < 0 || to >= 24) t.off[p - 1]++;
    else {
      if (t.board[to] === -sgn) {
        t.board[to] = 0;
        t.bar[2 - p]++;
      }
      t.board[to] += sgn;
    }
    t.dice.splice(t.dice.indexOf(d), 1);
    return t;
  }
  function sequences(s) {
    let best = [];
    for (const d of new Set(s.dice))
      for (const m of raw(s, d)) {
        const t = step(s, m),
          rest = sequences(t);
        if (rest.length) for (const seq of rest) best.push([m, ...seq]);
        else best.push([m]);
      }
    if (!best.length) return [];
    const longest = Math.max(...best.map((x) => x.length));
    return best.filter((x) => x.length === longest);
  }
  function legal(s) {
    let seq = sequences(s);
    if (!seq.length) return [[-2, 0]];
    if (seq[0].length === 1) {
      const higher = Math.max(...seq.map((x) => x[0][1]));
      seq = seq.filter((x) => x[0][1] === higher);
    }
    return [...new Map(seq.map((x) => [JSON.stringify(x[0]), x[0]])).values()];
  }
  function apply(s, m) {
    let t = m[0] === -2 ? S.clone(s) : step(s, m);
    t.moves++;
    if (m[0] === -2 || !t.dice.length || !sequences(t).length) {
      t.turn = 3 - s.turn;
      t.dice = roll();
      t.notice = `Kości: ${t.dice.join(" · ")}.`;
      t.round++;
    }
    return t;
  }
  S.duel({
    initial() {
      selected = null;
      const board = Array(24).fill(0);
      for (const [i, n] of [
        [0, 2],
        [11, 5],
        [16, 3],
        [18, 5],
      ]) {
        board[i] = n;
        board[23 - i] = -n;
      }
      return {
        board,
        turn: 1,
        bar: [0, 0],
        off: [0, 0],
        dice: roll(),
        moves: 0,
        round: 0,
      };
    },
    legal,
    apply,
    result: (s) => (s.off[0] === 15 ? 1 : s.off[1] === 15 ? 2 : null),
    scores: (s) => s.off,
    choose(s) {
      let best = -Infinity,
        pick = null;
      for (const m of legal(s)) {
        const t = m[0] === -2 ? s : step(s, m),
          p = s.turn,
          sgn = sign(p),
          blots = t.board.filter((v) => v === sgn).length,
          score =
            t.off[p - 1] * 30 +
            t.bar[2 - p] * 8 -
            blots * 2 -
            t.board.reduce(
              (sum, v, i) =>
                sum +
                (v * sgn > 0 ? Math.abs(v) * (p === 1 ? 24 - i : i + 1) : 0),
              0,
            );
        if (score > best) {
          best = score;
          pick = m;
        }
      }
      return pick;
    },
    resetSelection: () => (selected = null),
    setup(H, get, play) {
      window.addEventListener("resize", () => H.render());
      H.button(
        "Z bandy",
        () => {
          selected = -1;
          H.render();
        },
        H.extra,
      );
      H.button(
        "Do domu",
        () => {
          const s = get(),
            m = legal(s).find(
              (m) =>
                m[0] === selected &&
                (s.turn === 1 ? m[0] + m[1] >= 24 : m[0] - m[1] < 0),
            );
          if (m) {
            selected = null;
            play(m);
          }
        },
        H.extra,
      );
      H.button("Oddaj turę", () => play([-2, 0]), H.extra);
    },
    draw(H, s, play) {
      const moves = legal(s),
        order = [
          ...Array.from({ length: 12 }, (_, i) => 23 - i),
          ...Array.from({ length: 12 }, (_, i) => i),
        ];
      if (s.bar[s.turn - 1]) selected = -1;
      H.grid(
        innerWidth < 550 ? 6 : 12,
        order.map(
          (i) => `${i + 1}\n${s.board[i] ? Math.abs(s.board[i]) + "●" : "·"}`,
        ),
        (k) => {
          const i = order[k];
          if (s.board[i] * sign(s.turn) > 0 && !s.bar[s.turn - 1]) {
            selected = i;
            H.render();
            return;
          }
          const m = moves.find(
            ([from, d]) =>
              from === selected &&
              (from === -1
                ? s.turn === 1
                  ? d - 1
                  : 24 - d
                : from + sign(s.turn) * d) === i,
          );
          if (m) {
            selected = null;
            play(m);
          }
        },
        (b, k) => {
          const i = order[k];
          b.style.whiteSpace = "pre-line";
          b.dataset.selected = String(i === selected);
          b.style.color = s.board[i] < 0 ? "var(--accent)" : "var(--ink)";
          const top = k < 12,
            count = Math.abs(s.board[i]);
          b.innerHTML = `<svg viewBox="0 0 50 100" aria-hidden="true"><text x="25" y="12" text-anchor="middle" fill="currentColor" font-size="12" font-family="monospace">${i + 1}</text><path d="${top ? "M4 18 25 94 46 18Z" : "M4 94 25 18 46 94Z"}" class="hu-bg-point" data-alternate="${i % 2}"/>${Array.from({ length: Math.min(5, count) }, (_, j) => `<circle cx="25" cy="${top ? 27 + j * 14 : 83 - j * 14}" r="7" class="hu-bg-man" data-owner="${s.board[i] > 0 ? 1 : 2}"/>`).join("")}${count > 5 ? `<text x="25" y="60" text-anchor="middle" fill="currentColor" font-size="13">${count}</text>` : ""}</svg>`;
          b.setAttribute(
            "aria-label",
            `Punkt ${i + 1}, ${Math.abs(s.board[i])} pionków ${s.board[i] > 0 ? "gracza I" : "gracza II"}`,
          );
        },
      );
      H.say(
        `Kości: ${s.dice.join(" · ")}. Banda I: ${s.bar[0]}, II: ${s.bar[1]}. ${s.bar[s.turn - 1] ? "Najpierw wróć z bandy." : "Wybierz pionek i cel."}`,
      );
    },
    hint: "Gracz I idzie od 1 do 24, II odwrotnie. Automat rzuca kości; dublet daje cztery ruchy. Użyj maksymalnej liczby kości, przy jednym ruchu większej. Zbijasz samotne pionki, z bandy wracasz najpierw. Wyprowadź 15 pionków. I zaczyna (uproszczenie otwarcia).",
  });
  MoreGame.raw = raw;
  MoreGame.step = step;
})();
