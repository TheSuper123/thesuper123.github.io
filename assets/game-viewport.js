/* Keep the actual board and actual controls together, without scaling the page. */
(() => {
  "use strict";
  function setup() {
    const body = document.body,
      kind = body.dataset.game,
      main = document.querySelector("main");
    if (
      !main ||
      ["fish", "polls", "soon", "quiz", "incremental"].includes(kind)
    )
      return;
    document.documentElement.classList.add("gv-active");
    body.classList.add("gv-page");
    if (kind === "arena") {
      body.classList.add("gv-arena");
      body.dataset.viewportReady = "true";
      return;
    }
    const cabinet =
      main.querySelector(".ng-cabinet,.mine-card,.ttt-card,.maze-panel") ||
      main;
    cabinet.classList.add("gv-cabinet");
    main.classList.add("gv-main");
    const dialog = document.createElement("dialog");
    dialog.className = "gv-dialog";
    dialog.setAttribute("aria-label", "Opcje i zasady gry");
    dialog.innerHTML =
      '<button class="dialog-close" aria-label="Zamknij opcje">×</button><h2>Opcje i zasady</h2><div class="gv-settings"></div><div class="gv-information"></div>';
    dialog.querySelector("button").onclick = () => dialog.close();
    dialog.addEventListener("keydown", (event) => event.stopPropagation());
    body.append(dialog);
    const regions = {};
    for (const name of ["hud", "actions", "field", "input", "status"]) {
      const div = document.createElement("div");
      div.className = "gv-" + name;
      regions[name] = div;
    }
    const settings = dialog.querySelector(".gv-settings"),
      information = dialog.querySelector(".gv-information");
    const move = (selector, into) =>
      [...cabinet.querySelectorAll(selector)].forEach((el) =>
        (regions[into] || into).append(el),
      );
    let board,
      ratio = 1;
    if (cabinet.classList.contains("ng-cabinet")) {
      board = cabinet.querySelector(".ng-stage");
      move(".ng-hud", "hud");
      [...cabinet.querySelectorAll(".ng-toolbar")]
        .filter((el) => !board?.contains(el))
        .forEach((el) => regions.actions.append(el));
      move(".ng-directions,.breakout-touch,.sudoku-pad,#more-extra", "input");
      move(".ng-status", "status");
      move(".ng-intro,.ng-help,.ng-level-status", information);
      const result = cabinet.querySelector("#more-result");
      if (result) {
        result.classList.add("gv-result");
        board.append(result);
      }
    } else if (kind === "snake") {
      board = cabinet.querySelector("#game-container");
      move(".snake-hud", "hud");
      move(".snake-controls", "input");
      move(".snake-toolbar", "actions");
      move(".snake-menu", settings);
    } else if (kind === "maze") {
      board = cabinet.querySelector(".maze-board");
      move(".maze-stats", "hud");
      move("#mobile-controls", "input");
      const active = cabinet.querySelector("#game-ui"),
        setup = cabinet.querySelector("#setup");
      [...active.querySelectorAll(".maze-toolbar")].forEach((el) =>
        regions.actions.append(el),
      );
      move("#maze-message", "status");
      if (setup) {
        setup.classList.add("gv-setup");
        regions.field.append(setup);
      }
    } else if (kind === "saper" || kind === "saper-classic") {
      board = cabinet.querySelector(".mine-playfield");
      move(".mine-dashboard", "hud");
      move(".mine-actions", "actions");
      move(".mine-mode", "input");
      move("#mine-status", "status");
      move(".mine-settings", settings);
    } else if (kind === "tictactoe") {
      board = cabinet.querySelector(".ttt-board-wrap");
      move(".ttt-score", "hud");
      move(".ttt-actions", "actions");
      move("#status", "status");
      move(".ttt-controls,.ttt-reset", settings);
    } else if (kind === "little-flight") {
      board = cabinet.querySelector("#cabinet");
      move(".flight-hud", "hud");
      move(".flight-toolbar", "actions");
      move("#bird-flap", "input");
      move("#bird-mode-label", settings);
      ratio = 360 / 500;
    } else if (kind === "geometry") {
      board = cabinet.querySelector("#gameBox");
      move(".run-strip", "hud");
      [...cabinet.children]
        .filter((el) => el.matches(".run-buttons"))
        .forEach((el) => regions.input.append(el));
      move("#run-message", "status");
      ratio = 16 / 9;
    } else if (kind === "tetris") {
      board = cabinet.querySelector(".fall-cabinet");
      move(".fall-top", "actions");
      move("#controls-mobile", "input");
      ratio = 0.72;
    } else if (kind === "bird") {
      board = cabinet.querySelector("#game-container");
      move(".bird-readout", "hud");
      move("#bird-pause", "actions");
      move(".bird-bottom", "status");
      ratio = 2 / 3;
      const flap = document.createElement("button");
      flap.textContent = "Podskocz ↑";
      flap.onclick = () => {
        if (typeof window.flapBird === "function") window.flapBird();
      };
      regions.input.append(flap);
    } else if (kind === "blocks") {
      board = cabinet.querySelector(".block-board-wrap");
      move(".block-score,.block-meters", "hud");
      move(".block-top-actions,.block-toolbar", "actions");
      move("#next-blocks", "input");
      move("#blocks-feedback", "status");
    } else if (kind === "doom") {
      board = cabinet.querySelector("#game-frame");
      ratio = 1.6;
      move(".doom-tools", "actions");
      move("#doom-status", "status");
      const decorate = () => {
        try {
          const doc = board.contentDocument;
          if (!doc?.querySelector(".scene")) return;
          doc.documentElement.classList.add("gv-doom-scene");
          if (!doc.querySelector("[data-viewport-style]")) {
            const link = doc.createElement("link");
            link.rel = "stylesheet";
            link.dataset.viewportStyle = "";
            link.href = document.querySelector(
              'link[href$="game-viewport.css"]',
            ).href;
            doc.head.append(link);
          }
        } catch {
          /* The archive only decorates its own local scenes. */
        }
      };
      board.addEventListener("load", decorate);
      decorate();
    } else if (kind === "unity") {
      board = cabinet.querySelector("#game-wrapper");
      ratio = 16 / 9;
      move(".unity-toolbar", "actions");
      move("#unity-status", "status");
      move("#unity-jump", "input");
      document.addEventListener("fullscreenchange", () => {
        const jump = document.querySelector("#unity-jump");
        if (jump)
          (document.fullscreenElement === board ? board : regions.input).append(
            jump,
          );
      });
    } else
      board = cabinet.querySelector(
        "#game-wrapper,#game-frame,#game-container,canvas,#board,#game",
      );
    if (!board) {
      document.documentElement.classList.remove("gv-active");
      body.classList.remove("gv-page");
      return;
    }
    regions.field.append(board);
    board.classList.add("gv-board");
    [...regions.actions.querySelectorAll("label")]
      .filter((el) => el.querySelector("select,input"))
      .forEach((el) => settings.append(el));
    for (const child of [...cabinet.children])
      if (!Object.values(regions).includes(child)) information.append(child);
    const options = document.createElement("button");
    options.className = "gv-options";
    options.textContent = "Opcje";
    options.setAttribute("aria-label", "Opcje i zasady gry");
    options.onclick = () => dialog.showModal();
    regions.actions.append(options);
    cabinet.append(...Object.values(regions));
    let queued = false;
    function fit() {
      queued = false;
      const r = regions.field.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const canvas = board.querySelector("canvas");
      if (canvas && !["geometry", "tetris", "unity"].includes(kind))
        ratio = (canvas.width || 1) / (canvas.height || 1);
      const grid = board.querySelector(
        ".mo-board,.memory-board,.tiles-board,.sudoku-board,#board",
      );
      if (grid && !canvas) {
        const columns =
          getComputedStyle(grid).gridTemplateColumns.split(" ").length;
        if (columns > 1 && grid.children.length)
          ratio = columns / Math.ceil(grid.children.length / columns);
      }
      if (kind === "mancala") ratio = 2.7;
      if (kind === "hanoi") ratio = 1.9;
      if (kind === "codebreaker") ratio = 1.8;
      if (kind === "word-guess") ratio = 2.5;
      if (kind === "nonogram") ratio = 1;
      if (kind === "tetris") ratio = 0.72;
      if (kind === "doom") ratio = 1.6;
      if (kind === "unity") ratio = 16 / 9;
      const declared = board.querySelector("[data-aspect]")?.dataset.aspect;
      if (Number(declared) > 0) ratio = Number(declared);
      let width = Math.min(r.width, r.height * ratio),
        height = width / ratio;
      if (kind === "saper" || kind === "saper-classic") {
        const grid = board.querySelector("#game"),
          count = grid?.children.length || 81,
          match = grid?.style.gridTemplateColumns.match(/repeat\((\d+)/),
          cols = match ? Number(match[1]) : Math.sqrt(count),
          rows = Math.ceil(count / cols);
        ratio = cols / rows;
        width = Math.min(r.width, r.height * ratio, cols * 44 + 18);
        height = width / ratio;
        const size = Math.max(
          8,
          Math.min(
            42,
            Math.floor(
              Math.min(
                (width - 18 - (cols - 1) * 2) / cols,
                (height - 18 - (rows - 1) * 2) / rows,
              ),
            ),
          ),
        );
        grid?.style.setProperty("--cell-size", size + "px");
      }
      for (const [key, value] of [
        ["width", width],
        ["height", height],
      ])
        if (
          board.style.getPropertyValue("--gv-" + key) !==
          value.toFixed(2) + "px"
        )
          board.style.setProperty("--gv-" + key, value.toFixed(2) + "px");
      body.dataset.viewportReady = "true";
    }
    const schedule = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(fit);
      }
    };
    new ResizeObserver(schedule).observe(regions.field);
    new ResizeObserver(schedule).observe(regions.input);
    new MutationObserver(schedule).observe(board, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-pairs", "hidden"],
    });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    document.fonts.ready.then(schedule);
    fit();
    schedule();
    window.SpinnerViewport = {
      fit: schedule,
      board,
      field: regions.field,
      input: regions.input,
    };
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
