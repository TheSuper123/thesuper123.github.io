/* Shared presentation and input; each cabinet keeps its own rules and state. */
(() => {
  "use strict";
  const N = window.SpinnerNew;
  const $ = (id) => document.getElementById(id);
  function create(labels) {
    const timer = N.clock(),
      board = $("board"),
      controls = $("more-controls"),
      extra = $("more-extra");
    let phase = "ready",
      previous = "ready",
      lastTick = performance.now(),
      recordKey = null;
    const H = {
      board,
      controls,
      extra,
      timer,
      onPause: () => {},
      onResume: () => {},
      onTick: () => {},
      onRender: () => {},
      onNew: () => {},
      pauseKey: "p",
      get phase() {
        return phase;
      },
      get elapsed() {
        return timer.elapsed;
      },
      active: () => phase === "ready" || phase === "playing",
      start() {
        if (phase === "ready") {
          phase = "playing";
          timer.start();
        }
      },
      reset() {
        phase = "ready";
        previous = "ready";
        timer.reset();
        $("more-result").hidden = true;
        $("more-cover").hidden = true;
        $("more-pause").disabled = false;
        $("more-pause").textContent = "Pauza";
        H.say("");
        H.render();
      },
      finish(message, won = true) {
        if (!H.active()) return;
        phase = won ? "won" : "lost";
        timer.stop();
        H.onPause();
        extra
          .querySelectorAll("[data-held]")
          .forEach((b) => b.removeAttribute("data-held"));
        H.say(message, won ? "win" : "error");
        $("more-result").hidden = false;
        $("more-result-text").textContent = message;
        $("more-pause").disabled = true;
        H.render();
      },
      reopen() {
        phase = "playing";
        timer.start();
        $("more-result").hidden = true;
        $("more-cover").hidden = true;
        $("more-pause").disabled = false;
        $("more-pause").textContent = "Pauza";
      },
      pause() {
        if (!H.active()) return;
        previous = phase;
        phase = "paused";
        timer.stop();
        H.onPause();
        extra
          .querySelectorAll("[data-held]")
          .forEach((b) => b.removeAttribute("data-held"));
        $("more-cover").hidden = false;
        $("more-pause").textContent = "Wznów";
        H.render();
      },
      resume() {
        if (phase !== "paused") return;
        phase = previous;
        if (phase === "playing") timer.start();
        $("more-cover").hidden = true;
        $("more-pause").textContent = "Pauza";
        H.onResume();
        H.render();
      },
      say(text, result = "") {
        $("more-status").textContent = text;
        $("more-status").dataset.result = result;
      },
      stats(values) {
        values.forEach((value, i) => {
          $("more-stat-" + i).textContent = value;
        });
      },
      render() {
        H.onRender();
      },
      record(key, value, lower = false, unit = "ruchów") {
        recordKey = key;
        const stored = N.prefs.get("more:" + key, null);
        const best =
          stored === null
            ? lower
              ? Number.MAX_SAFE_INTEGER
              : 0
            : N.number(stored, lower ? Number.MAX_SAFE_INTEGER : 0);
        if (
          Number.isFinite(value) &&
          value >= 0 &&
          (lower ? value < best : value > best)
        )
          N.prefs.set("more:" + key, value);
        const saved = N.prefs.get("more:" + key, null);
        $("more-record").textContent =
          saved === null
            ? "Rekord zapiszesz na później po włączeniu zapisu w ustawieniach prywatności."
            : `Najlepszy wynik: ${N.number(saved)}${lower ? " " + unit : ""}.`;
      },
      button(text, action, parent = controls, className = "") {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.className = className;
        b.onclick = action;
        parent.append(b);
        return b;
      },
      select(label, options, action) {
        const wrap = document.createElement("label"),
          s = document.createElement("select");
        wrap.textContent = label;
        s.setAttribute("aria-label", label);
        options.forEach(([value, text]) => {
          const o = document.createElement("option");
          o.value = value;
          o.textContent = text;
          s.append(o);
        });
        wrap.append(s);
        controls.append(wrap);
        s.onchange = () => action(s.value);
        return s;
      },
      grid(columns, labels, action, decorate = () => {}) {
        const focused = board.contains(document.activeElement),
          old = Number(document.activeElement?.dataset.index || 0);
        board.style.setProperty("--cols", columns);
        board.dataset.columns = columns;
        board.replaceChildren(
          ...labels.map((label, i) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "mo-cell";
            b.dataset.index = i;
            b.textContent = label;
            b.tabIndex = i === old ? 0 : -1;
            b.setAttribute(
              "aria-label",
              label ||
                `Pole ${Math.floor(i / columns) + 1}, ${(i % columns) + 1}`,
            );
            b.onpointerdown = (event) => {
              if (event.button !== 0 || !event.isPrimary) return;
              event.preventDefault();
              b.focus({ preventScroll: true });
              action(i, event);
            };
            b.onclick = (event) => {
              if (event.detail === 0) action(i, event);
            };
            decorate(b, i);
            return b;
          }),
        );
        if (focused && phase !== "paused")
          board
            .querySelector(`[data-index="${old}"]`)
            ?.focus({ preventScroll: true });
      },
      keys(action) {
        document.addEventListener("keydown", (event) => {
          if (N.editing(event) || !H.active()) return;
          if (
            event.target.closest?.("button") &&
            [" ", "Enter"].includes(event.key)
          )
            return;
          if (action(event.key, event) === true) event.preventDefault();
        });
      },
      hold(text, key, keys, parent = extra) {
        const b = H.button(text, () => {}, parent, "mo-hold");
        b.dataset.key = key;
        const stop = () => {
          keys.delete(key);
          b.removeAttribute("data-held");
        };
        b.onpointerdown = (e) => {
          if (e.button !== 0 || !e.isPrimary || !H.active()) return;
          e.preventDefault();
          b.setPointerCapture(e.pointerId);
          H.start();
          keys.add(key);
          b.dataset.held = "true";
        };
        for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
          b.addEventListener(name, stop);
        b.onkeydown = (e) => {
          if ([" ", "Enter"].includes(e.key) && H.active()) {
            e.preventDefault();
            H.start();
            keys.add(key);
          }
        };
        b.onkeyup = (e) => {
          if ([" ", "Enter"].includes(e.key)) stop();
        };
        b.addEventListener("blur", stop);
        window.addEventListener("blur", stop);
        return b;
      },
      canvas(width, height) {
        board.className = "mo-canvas-wrap";
        const canvas = document.createElement("canvas");
        canvas.id = "game";
        canvas.tabIndex = 0;
        canvas.width = width;
        canvas.height = height;
        canvas.setAttribute(
          "aria-label",
          document.title + ". " + $("more-help").textContent,
        );
        canvas.style.aspectRatio = `${width}/${height}`;
        board.replaceChildren(canvas);
        const ctx = canvas.getContext("2d");
        const resize = () => {
          const dpr = Math.min(devicePixelRatio || 1, 2);
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          H.render();
        };
        window.addEventListener("resize", resize);
        resize();
        return {
          canvas,
          ctx,
          width,
          height,
          point: (e) => {
            const r = canvas.getBoundingClientRect();
            return {
              x: ((e.clientX - r.left) * width) / r.width,
              y: ((e.clientY - r.top) * height) / r.height,
            };
          },
        };
      },
      loop(update, draw) {
        let last = performance.now(),
          acc = 0,
          dirty = true;
        const invalidate = () => {
          dirty = true;
        };
        const oldRender = H.onRender;
        H.onRender = () => {
          oldRender();
          invalidate();
        };
        function frame(now) {
          const dt = Math.min(0.08, Math.max(0, (now - last) / 1000));
          last = now;
          if (phase === "playing") {
            acc += dt;
            while (acc >= 1 / 120 && phase === "playing") {
              update(1 / 120);
              acc -= 1 / 120;
            }
            dirty = true;
          } else acc = 0;
          if (dirty) {
            draw();
            dirty = false;
          }
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        return invalidate;
      },
    };
    labels.forEach((label, i) => ($("more-label-" + i).textContent = label));
    board.addEventListener("keydown", (e) => {
      if (
        !H.active() ||
        board.dataset.navigation === "game" ||
        !e.target.matches(".mo-cell") ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey
      )
        return;
      const cols = Number(board.dataset.columns),
        cells = [...board.querySelectorAll(".mo-cell")];
      const delta = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -cols,
        ArrowDown: cols,
      }[e.key];
      if (!delta) return;
      e.preventDefault();
      e.stopPropagation();
      let next = Number(e.target.dataset.index);
      for (let k = 0; k < cells.length; k++) {
        next = (next + delta + cells.length) % cells.length;
        if (!cells[next].disabled) break;
      }
      cells.forEach((b, i) => (b.tabIndex = i === next ? 0 : -1));
      cells[next]?.focus({ preventScroll: true });
    });
    $("more-new").onclick = $("more-again").onclick = () => H.onNew();
    $("more-resume").onclick = H.resume;
    $("more-pause").onclick = () =>
      phase === "paused" ? H.resume() : H.pause();
    document.addEventListener("keydown", (e) => {
      if (N.editing(e) || e.repeat) return;
      if (
        (H.pauseKey && e.key.toLowerCase() === H.pauseKey) ||
        e.key === "Escape"
      ) {
        e.preventDefault();
        phase === "paused" ? H.resume() : H.pause();
      }
    });
    N.pauses(H.pause);
    setInterval(() => {
      const now = performance.now(),
        dt = Math.min(0.15, (now - lastTick) / 1000);
      lastTick = now;
      if (phase === "playing") H.onTick(dt);
    }, 50);
    window.addEventListener("spinner:theme-change", () => H.render());
    window.addEventListener("spinner:preferences-cleared", () => {
      if (recordKey) H.record(recordKey);
      H.render();
    });
    window.SpinnerGame = { render: () => H.render(), pause: H.pause };
    return H;
  }
  const backdrop = (ctx, width, height) => {
    const p = SpinnerTheme.palette;
    ctx.fillStyle = p.board;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = p.grid;
    ctx.lineWidth = 0.7;
    for (let x = 20; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 20; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    return p;
  };
  window.SpinnerMore = { create, backdrop, ...N };
})();
