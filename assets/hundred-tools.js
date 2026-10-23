/* Presentation, undo and geometry; the game files define their own rules. */
(() => {
  "use strict";
  const S = window.SpinnerThirty;
  const neighbors = (i, n, diagonal = false) => {
    const out = [],
      r = Math.floor(i / n),
      c = i % n;
    for (let y = -1; y <= 1; y++)
      for (let x = -1; x <= 1; x++)
        if (
          (x || y) &&
          (diagonal || !x || !y) &&
          r + y >= 0 &&
          r + y < n &&
          c + x >= 0 &&
          c + x < n
        )
          out.push((r + y) * n + c + x);
    return out;
  };
  const connected = (cells, n) => {
    const allowed = new Set(cells),
      seen = new Set(),
      pending = cells.length ? [cells[0]] : [];
    while (pending.length) {
      const i = pending.pop();
      if (seen.has(i)) continue;
      seen.add(i);
      for (const j of neighbors(i, n))
        if (allowed.has(j) && !seen.has(j)) pending.push(j);
    }
    return !!cells.length && seen.size === cells.length;
  };
  function puzzle(rules) {
    const H = S.create(rules.labels || ["RUCHY", "CZAS", "CEL"]);
    let state,
      history = [],
      tool = 1;
    const undo = () => {
      if (!history.length || H.phase === "paused") return false;
      state = history.pop();
      H.reopen();
      H.say("Cofnięto ruch.");
      H.render();
      return true;
    };
    const act = (i, v = tool) => {
      if (
        !H.active() ||
        !Number.isInteger(i) ||
        i < 0 ||
        i >= state.board.length ||
        state.fixed?.[i]
      )
        return false;
      const before = S.clone(state);
      if (rules.action ? rules.action(state, i, v) === false : false)
        return false;
      if (!rules.action) state.board[i] = state.board[i] === v ? 0 : v;
      if (JSON.stringify(before) === JSON.stringify(state)) return false;
      history.push(before);
      H.start();
      state.moves = (state.moves || 0) + 1;
      if (rules.valid(state))
        H.finish(rules.win || "Układ gotowy. Wszystkie warunki spełnione!");
      else {
        H.say(rules.hint || "Układaj bez pośpiechu. Możesz cofać ruchy.");
        H.render();
      }
      return true;
    };
    function render() {
      H.stats([
        state.moves || 0,
        S.time(H.elapsed),
        rules.goal || rules.n + " × " + rules.n,
      ]);
      if (rules.render) rules.render(H, state, act, tool);
      else
        H.grid(
          rules.n,
          state.board.map((v, i) =>
            rules.text ? rules.text(state, i) : v || "",
          ),
          act,
          (b, i) => {
            b.classList.toggle("hu-black", state.board[i] === -1);
            b.classList.toggle("hu-mark", state.board[i] === 1);
            b.dataset.fixed = String(!!state.fixed?.[i]);
            b.disabled = !!state.fixed?.[i];
            b.setAttribute(
              "aria-label",
              `Wiersz ${Math.floor(i / rules.n) + 1}, kolumna ${(i % rules.n) + 1}: ${b.textContent || (state.board[i] === -1 ? "zaznaczone" : "puste")}`,
            );
            rules.decorate?.(b, i, state);
          },
        );
      undoButton.disabled = !history.length || H.phase === "paused";
      for (const [value, b] of tools)
        b.setAttribute("aria-pressed", String(tool === value));
    }
    const undoButton = H.button("Cofnij", undo),
      tools = [];
    H.button("Sprawdź", () => {
      if (H.active())
        H.say(
          rules.valid(state)
            ? "Wszystkie warunki spełnione."
            : rules.explain?.(state) ||
                "Układ nie spełnia jeszcze wszystkich warunków.",
        );
    });
    if (rules.tools)
      for (const [v, label] of rules.tools)
        tools.push([
          v,
          H.button(
            label,
            () => {
              tool = v;
              H.render();
            },
            H.extra,
          ),
        ]);
    H.keys((key, e) => {
      if (e.repeat) return false;
      if (key.toLowerCase() === "u") {
        undo();
        return true;
      }
      if (rules.tools && /^[0-9]$/.test(key)) {
        const v = Number(key);
        if (tools.some(([x]) => x === v)) {
          tool = v;
          H.render();
          return true;
        }
      }
    });
    H.onRender = render;
    H.onTick = () =>
      H.stats([
        state.moves || 0,
        S.time(H.elapsed),
        rules.goal || rules.n + " × " + rules.n,
      ]);
    H.onNew = () => {
      state = rules.initial();
      history = [];
      tool = rules.tools?.[0]?.[0] ?? 1;
      H.reset();
      H.say(rules.hint || "Wybierz pole, aby zacząć.");
    };
    S.api(
      H,
      {
        act,
        undo,
        valid: (s = state) => rules.valid(s),
        getState: () => state,
        setTool: (v) => {
          tool = v;
          H.render();
        },
        rules,
      },
      () => state,
    );
    H.onNew();
    return H;
  }
  function duel(rules) {
    const H = S.create(["KOLEJKA", "WYNIK I", "WYNIK II"]);
    let state,
      history = [],
      mode = "cpu",
      due = Infinity;
    H.select(
      "RYWAL",
      [
        ["cpu", "Komputer"],
        ["local", "Druga osoba"],
      ],
      (v) => {
        mode = v;
        H.onNew();
      },
    );
    const play = (move, computer = false) => {
      if (!H.active() || (mode === "cpu" && state.turn === 2) !== computer)
        return false;
      const legal = rules.legal(state),
        code = JSON.stringify(move);
      if (!legal.some((m) => JSON.stringify(m) === code)) return false;
      history.push(S.clone(state));
      H.start();
      state = rules.apply(state, move);
      const result = rules.result(state);
      if (result !== null)
        H.finish(
          result === 0
            ? "Remis."
            : `Wygrywa ${result === 2 && mode === "cpu" ? "komputer" : "gracz " + (result === 1 ? "I" : "II")}!`,
          result !== 2 || mode === "local",
        );
      else {
        due = H.elapsed + 280;
        H.say(state.notice || `Ruch gracza ${state.turn === 1 ? "I" : "II"}.`);
        H.render();
      }
      return true;
    };
    const choose = (s = state) => {
      if (rules.choose) return rules.choose(s);
      let best = -Infinity,
        selected = null;
      for (const m of S.shuffle(rules.legal(s))) {
        const next = rules.apply(s, m),
          r = rules.result(next),
          v =
            r === s.turn
              ? 1e6
              : r === 3 - s.turn
                ? -1e6
                : rules.evaluate?.(next, s.turn) || 0;
        if (v > best) {
          best = v;
          selected = m;
        }
      }
      return selected;
    };
    const undo = () => {
      if (!history.length || H.phase === "paused") return false;
      state = history.pop();
      while (mode === "cpu" && state.turn === 2 && history.length)
        state = history.pop();
      rules.resetSelection?.();
      H.reopen();
      due = H.elapsed + 280;
      H.say("Ruch cofnięty.");
      H.render();
      return true;
    };
    H.button("Cofnij", undo);
    H.onRender = () => {
      H.stats([
        state.turn === 1 ? "Gracz I" : "Gracz II",
        ...(rules.scores?.(state) || [0, 0]),
      ]);
      rules.draw(H, state, (m) => play(m));
    };
    H.onTick = () => {
      if (mode === "cpu" && state.turn === 2 && H.elapsed >= due) {
        due = Infinity;
        const m = choose();
        if (m !== null && m !== undefined) play(m, true);
      }
    };
    H.onNew = () => {
      state = rules.initial();
      history = [];
      due = Infinity;
      H.reset();
      H.say(rules.hint || "Zaczyna gracz I.");
    };
    H.keys((k, e) => {
      if (!e.repeat && k.toLowerCase() === "u") {
        undo();
        return true;
      }
    });
    S.api(
      H,
      {
        move: play,
        choose,
        undo,
        rules,
        getState: () => state,
        cpu: () => play(choose(), true),
      },
      () => ({ ...state, mode }),
    );
    rules.setup?.(
      H,
      () => state,
      (m) => play(m),
    );
    H.onNew();
    return H;
  }
  const circle = (ctx, x, y, r, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  function arcade(rules) {
    const H = S.create(rules.labels),
      M = S.motion(H, rules.width || 720, rules.height || 480),
      Q = { H, ...M };
    let state;
    for (const [label, key, codes] of rules.binds || [])
      M.bind(label, key, codes);
    H.button("Start", () => H.start());
    const methods = rules.setup?.(Q, () => state) || {};
    H.keys((key, event) => {
      if (key === " " && !event.repeat) {
        if (rules.space) rules.space(state, Q);
        else H.start();
        return true;
      }
    });
    H.onNew = () => {
      M.keys.clear();
      state = rules.initial(Q);
      for (const input of H.extra.querySelectorAll("[data-state-field]"))
        if (Number.isFinite(state[input.dataset.stateField]))
          input.value = state[input.dataset.stateField];
      H.reset();
      H.say(rules.hint);
    };
    H.onTick = () => H.stats(rules.stats(state, Q));
    H.onRender = () => {
      if (state) H.stats(rules.stats(state, Q));
      for (const control of H.extra.querySelectorAll("button,input"))
        control.disabled = !H.active();
    };
    const update = (dt) => rules.update(state, Q, dt);
    H.loop(update, () => {
      if (state) {
        const p = S.backdrop(M.ctx, M.width, M.height);
        rules.draw(state, Q, p);
      }
    });
    S.api(
      H,
      {
        ...methods,
        advance: (dt) => S.advance(H, update, dt),
        getState: () => state,
      },
      () => state,
    );
    H.onNew();
    return H;
  }
  window.SpinnerHundred = {
    ...S,
    neighbors,
    connected,
    puzzle,
    duel,
    arcade,
    circle,
  };
})();
