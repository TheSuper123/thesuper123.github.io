(() => {
  "use strict";
  const { prefs, editing, press, pauses } = SpinnerNew,
    $ = (id) => document.getElementById(id),
    canvas = $("game"),
    ctx = canvas.getContext("2d");
  const directions = {
      up: [0, -1],
      right: [1, 0],
      down: [0, 1],
      left: [-1, 0],
    },
    opposite = { up: "down", right: "left", down: "up", left: "right" };
  const designs = [
    [
      "Mały magazyn",
      ["######", "#....#", "#..g.#", "#.@..#", "#....#", "######"],
    ],
    [
      "Dwa narożniki",
      [
        "#######",
        "#g....#",
        "#..#..#",
        "#..@..#",
        "#..#..#",
        "#....g#",
        "#######",
      ],
    ],
    [
      "Między filarami",
      [
        "########",
        "#...#..#",
        "#.g....#",
        "#...#g.#",
        "#.@....#",
        "#......#",
        "########",
      ],
    ],
    [
      "Trzy przesyłki",
      [
        "########",
        "#..g...#",
        "#.#..#.#",
        "#......#",
        "#.g@g..#",
        "#.#..#.#",
        "#......#",
        "########",
      ],
    ],
    [
      "Boczna alejka",
      [
        "#########",
        "#..#....#",
        "#.g..g..#",
        "#..#....#",
        "#...@...#",
        "#.g..#..#",
        "#.......#",
        "#########",
      ],
    ],
    [
      "Cztery cele",
      [
        "#########",
        "#.......#",
        "#.g...g.#",
        "#...#...#",
        "#...@...#",
        "#...#...#",
        "#.g...g.#",
        "#.......#",
        "#########",
      ],
    ],
    [
      "Długi korytarz",
      [
        "##########",
        "#..g.....#",
        "#..#..#..#",
        "#......g.#",
        "#.g.@....#",
        "#..#..#..#",
        "#.....g..#",
        "##########",
      ],
    ],
    [
      "Ostatnia dostawa",
      [
        "##########",
        "#........#",
        "#.g.#..g.#",
        "#...#....#",
        "#....@...#",
        "#..#..#..#",
        "#.g....g.#",
        "#........#",
        "##########",
      ],
    ],
  ];
  function random(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let n = value;
      n = Math.imul(n ^ (n >>> 15), n | 1);
      n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
  }
  function buildLevel(index) {
    const [name, rows] = designs[index],
      width = rows[0].length,
      height = rows.length,
      walls = new Set(),
      goals = new Set();
    let origin = 0;
    rows.forEach((line, y) =>
      [...line].forEach((tile, x) => {
        const cell = y * width + x;
        if (tile === "#") walls.add(cell);
        if (tile === "g") goals.add(cell);
        if (tile === "@") origin = cell;
      }),
    );
    const free = (cell) =>
      cell >= 0 && cell < width * height && !walls.has(cell);
    const signature = (player, boxes) =>
      player + ":" + [...boxes].sort((a, b) => a - b).join(",");
    let best = null,
      bestScore = -1;
    // Start solved and pull crates backwards. Reversing the recorded path is
    // a constructive solvability certificate for every original layout.
    for (let attempt = 0; attempt < 4; attempt++) {
      const rng = random(42191 + index * 17303 + attempt * 7919);
      let player = origin,
        boxes = new Set(goals),
        trace = [];
      let route = [signature(player, boxes)],
        seen = new Map([[route[0], 0]]);
      for (let step = 0; step < 170 + index * 65; step++) {
        const legal = Object.entries(directions).flatMap(([key, [dx, dy]]) => {
          const offset = dx + dy * width,
            dest = player + offset;
          return free(dest) && !boxes.has(dest)
            ? [{ key, offset, dest, pull: boxes.has(player - offset) }]
            : [];
        });
        if (!legal.length) break;
        const pulls = legal.filter((move) => move.pull),
          pool = pulls.length && rng() < 0.72 ? pulls : legal,
          move = pool[Math.floor(rng() * pool.length)];
        if (move.pull) {
          boxes.delete(player - move.offset);
          boxes.add(player);
        }
        player = move.dest;
        const key = signature(player, boxes);
        if (seen.has(key)) {
          const at = seen.get(key);
          trace.length = at;
          route.length = at + 1;
          seen = new Map(route.map((state, i) => [state, i]));
        } else {
          trace.push(move.key);
          route.push(key);
          seen.set(key, trace.length);
        }
        const unsettled = [...boxes].filter((cell) => !goals.has(cell)).length;
        const distance = [...boxes].reduce(
          (sum, cell) =>
            sum +
            Math.min(
              ...[...goals].map(
                (goal) =>
                  Math.abs((cell % width) - (goal % width)) +
                  Math.abs(Math.floor(cell / width) - Math.floor(goal / width)),
              ),
            ),
          0,
        );
        const score = unsettled * 7 + distance;
        if (unsettled && score > bestScore) {
          bestScore = score;
          best = {
            player,
            boxes: [...boxes],
            certificate: [...trace].reverse().map((key) => opposite[key]),
          };
        }
      }
    }
    if (!best) throw new Error("Could not construct a playable warehouse");
    return { name, width, height, walls, goals, ...best };
  }
  const levels = designs.map((_, i) => buildLevel(i));
  let levelIndex = 0,
    layout,
    player,
    boxes,
    steps = 0,
    pushes = 0,
    history = [],
    phase = "playing",
    facing = "down";
  const stopHolds = [];
  function record() {
    const saved = prefs.get("new:sokoban:records", {});
    return saved && typeof saved === "object" && !Array.isArray(saved)
      ? saved
      : {};
  }
  function say(text, result = "") {
    $("sokoban-status").textContent = text;
    $("sokoban-status").dataset.result = result;
  }
  function corner(cell) {
    const w = layout.width,
      walls = layout.walls;
    return (
      !layout.goals.has(cell) &&
      (walls.has(cell - 1) || walls.has(cell + 1)) &&
      (walls.has(cell - w) || walls.has(cell + w))
    );
  }
  function render() {
    const p = SpinnerTheme.palette,
      size = 64;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = p.board;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let cell = 0; cell < layout.width * layout.height; cell++) {
      const x = (cell % layout.width) * size,
        y = Math.floor(cell / layout.width) * size;
      if (layout.walls.has(cell)) {
        ctx.fillStyle = p.grid;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.strokeStyle = SpinnerTheme.alpha("ink", 0.13);
        ctx.strokeRect(x + 7, y + 7, size - 14, size - 14);
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + 3);
        ctx.lineTo(x + size / 2, y + size / 2);
        ctx.moveTo(x + 3, y + size / 2);
        ctx.lineTo(x + size - 3, y + size / 2);
        ctx.stroke();
        continue;
      }
      ctx.fillStyle =
        ((cell % layout.width) + Math.floor(cell / layout.width)) % 2
          ? SpinnerTheme.alpha("surface", 0.55)
          : p.board;
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = SpinnerTheme.alpha("muted", 0.12);
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      if (layout.goals.has(cell)) {
        ctx.strokeStyle = p.blue;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x + 12, y + 12, 40, 40);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(x + 32, y + 32, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (boxes.has(cell)) {
        const onGoal = layout.goals.has(cell);
        ctx.fillStyle = onGoal ? p.green : p.gold;
        ctx.fillRect(x + 8, y + 8, 48, 48);
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(x + 8, y + 8, 48, 48);
        ctx.strokeRect(x + 13, y + 13, 38, 38);
        ctx.beginPath();
        ctx.moveTo(x + 14, y + 14);
        ctx.lineTo(x + 50, y + 50);
        ctx.moveTo(x + 50, y + 14);
        ctx.lineTo(x + 14, y + 50);
        ctx.stroke();
        if (onGoal) {
          ctx.fillStyle = p.paper;
          ctx.beginPath();
          ctx.arc(x + 32, y + 32, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    const x = (player % layout.width) * 64 + 32,
      y = Math.floor(player / layout.width) * 64 + 32;
    ctx.fillStyle = SpinnerTheme.alpha("ink", 0.15);
    ctx.beginPath();
    ctx.ellipse(x, y + 15, 19, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = p.ink;
    const [dx, dy] = directions[facing];
    ctx.beginPath();
    ctx.arc(x + dx * 8 - dy * 5, y + dy * 8 + dx * 5, 2, 0, Math.PI * 2);
    ctx.arc(x + dx * 8 + dy * 5, y + dy * 8 - dx * 5, 2, 0, Math.PI * 2);
    ctx.fill();
    $("sokoban-level").textContent = `${levelIndex + 1} / ${levels.length}`;
    $("sokoban-steps").textContent = steps;
    $("sokoban-pushes").textContent = pushes;
    $("sokoban-undo").disabled = !history.length || phase === "paused";
    $("sokoban-pause").disabled = phase === "won";
    $("sokoban-pause").textContent = phase === "paused" ? "Wznów" : "Pauza";
    $("sokoban-cover").hidden = phase === "playing";
    $("sokoban-resume").hidden = phase === "won";
    $("sokoban-next").hidden = phase !== "won";
    $("sokoban-next").textContent =
      levelIndex === levels.length - 1
        ? "Wróć do pierwszego"
        : "Następny magazyn";
    $("sokoban-cover-title").textContent =
      phase === "won" ? "Dostawa na miejscu." : "Magazyn zaczeka.";
    $("sokoban-cover-copy").textContent =
      phase === "won"
        ? `${steps} kroków, ${pushes} pchnięć. Możesz cofnąć ruch i poszukać krótszej drogi.`
        : "Wznów, kiedy będziesz gotowy.";
    const best = record()[levelIndex];
    $("sokoban-record").textContent =
      best && Number.isInteger(best.pushes) && Number.isInteger(best.steps)
        ? `Najlepiej: ${best.pushes} pchnięć · ${best.steps} kroków`
        : `${layout.name} · wszystkie skrzynie muszą trafić na cele`;
  }
  function start(index = levelIndex) {
    levelIndex = Math.max(0, Math.min(levels.length - 1, Number(index) || 0));
    layout = levels[levelIndex];
    player = layout.player;
    boxes = new Set(layout.boxes);
    steps = pushes = 0;
    history = [];
    phase = "playing";
    facing = "down";
    stopHolds.forEach((stop) => stop());
    canvas.width = layout.width * 64;
    canvas.height = layout.height * 64;
    $("sokoban-select").value = levelIndex;
    say("Spójrz na cele, zanim przesuniesz pierwszą skrzynię.");
    render();
  }
  function move(direction) {
    if (phase !== "playing" || !directions[direction]) return false;
    const [dx, dy] = directions[direction],
      offset = dx + dy * layout.width,
      next = player + offset,
      beyond = next + offset;
    facing = direction;
    if (
      layout.walls.has(next) ||
      (boxes.has(next) && (layout.walls.has(beyond) || boxes.has(beyond)))
    ) {
      say("Brak przejścia. Spróbuj z innej strony.");
      render();
      return false;
    }
    history.push({ player, boxes: [...boxes], steps, pushes });
    if (history.length > 5000) history.shift();
    if (boxes.has(next)) {
      boxes.delete(next);
      boxes.add(beyond);
      pushes++;
    }
    player = next;
    steps++;
    if ([...boxes].every((cell) => layout.goals.has(cell))) {
      phase = "won";
      stopHolds.forEach((stop) => stop());
      const records = record(),
        previous = records[levelIndex];
      if (
        !previous ||
        pushes < previous.pushes ||
        (pushes === previous.pushes && steps < previous.steps)
      ) {
        records[levelIndex] = { steps, pushes };
        prefs.set("new:sokoban:records", records);
      }
      say("Każda skrzynia jest na swoim miejscu.", "win");
    } else if ([...boxes].some(corner))
      say("Skrzynia utknęła w narożniku bez celu. Cofnij ruch.", "error");
    else
      say(
        `${[...boxes].filter((cell) => layout.goals.has(cell)).length} z ${boxes.size} skrzyń na miejscu.`,
      );
    render();
    return true;
  }
  function undo() {
    if (!history.length || phase === "paused") return;
    const previous = history.pop();
    player = previous.player;
    boxes = new Set(previous.boxes);
    steps = previous.steps;
    pushes = previous.pushes;
    phase = "playing";
    say("Ruch cofnięty. Plan nadal można zmienić.");
    render();
  }
  function pause() {
    if (phase !== "playing") return;
    pointer = null;
    phase = "paused";
    stopHolds.forEach((stop) => stop());
    render();
  }
  function resume() {
    if (phase !== "paused") return;
    phase = "playing";
    render();
    canvas.focus({ preventScroll: true });
  }
  levels.forEach((level, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i + 1}. ${level.name}`;
    $("sokoban-select").append(option);
  });
  $("sokoban-select").onchange = () => start($("sokoban-select").value);
  $("sokoban-restart").onclick = () => start();
  $("sokoban-undo").onclick = undo;
  $("sokoban-pause").onclick = () => (phase === "paused" ? resume() : pause());
  $("sokoban-resume").onclick = resume;
  $("sokoban-next").onclick = () => start((levelIndex + 1) % levels.length);
  document
    .querySelectorAll("[data-direction]")
    .forEach((button) =>
      stopHolds.push(press(button, () => move(button.dataset.direction), true)),
    );
  const keys = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
    w: "up",
    d: "right",
    s: "down",
    a: "left",
  };
  document.addEventListener("keydown", (event) => {
    if (editing(event)) return;
    const key = event.key.toLowerCase(),
      direction = keys[event.key] || keys[key];
    if (direction) {
      event.preventDefault();
      move(direction);
    } else if (key === "u") {
      event.preventDefault();
      undo();
    } else if (key === "r" && !event.repeat) {
      event.preventDefault();
      start();
    } else if (key === "p" && !event.repeat) {
      event.preventDefault();
      phase === "paused" ? resume() : pause();
    }
  });
  let pointer = null;
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= 20)
      move(
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up",
      );
    else {
      const rect = canvas.getBoundingClientRect(),
        x = Math.floor(
          ((event.clientX - rect.left) / rect.width) * layout.width,
        ),
        y = Math.floor(
          ((event.clientY - rect.top) / rect.height) * layout.height,
        ),
        px = player % layout.width,
        py = Math.floor(player / layout.width);
      if (Math.abs(x - px) + Math.abs(y - py) === 1)
        move(x > px ? "right" : x < px ? "left" : y > py ? "down" : "up");
    }
  });
  canvas.addEventListener("pointercancel", () => (pointer = null));
  canvas.addEventListener("lostpointercapture", () => (pointer = null));
  pauses(pause);
  window.addEventListener("spinner:preferences-cleared", render);
  window.SpinnerGame = { render, pause };
  window.SokobanGame = {
    start,
    move,
    undo,
    levels: levels.map((level) => ({
      name: level.name,
      width: level.width,
      height: level.height,
      walls: [...level.walls],
      goals: [...level.goals],
      player: level.player,
      boxes: [...level.boxes],
      certificate: [...level.certificate],
    })),
    snapshot: () => ({
      level: levelIndex,
      player,
      boxes: [...boxes],
      steps,
      pushes,
      phase,
    }),
  };
  start(0);
})();
