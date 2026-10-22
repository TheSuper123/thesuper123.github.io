(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["TWOJE TRAFIENIA", "TRAFIENIA RYWALA", "STRZAŁY"]);
  H.board.className = "th-radar-wrap";
  H.board.dataset.aspect = ".58";
  let s;
  const neighbors = (i) => {
    const r = Math.floor(i / 8),
      c = i % 8;
    return [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
      .map(([a, b]) => [r + a, c + b])
      .filter(([y, x]) => y >= 0 && y < 8 && x >= 0 && x < 8)
      .map(([y, x]) => y * 8 + x);
  };
  function fleet() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const ships = [],
        used = new Set();
      let good = true;
      for (const length of [4, 3, 3, 2]) {
        const options = [];
        for (let r = 0; r < 8; r++)
          for (let c = 0; c < 8; c++)
            for (const [dr, dc] of [
              [0, 1],
              [1, 0],
            ]) {
              const cells = Array.from({ length }, (_, k) => [
                r + dr * k,
                c + dc * k,
              ]);
              if (cells.some(([y, x]) => y >= 8 || x >= 8)) continue;
              const ids = cells.map(([y, x]) => y * 8 + x);
              if (
                ids.every(
                  (i) =>
                    !used.has(i) &&
                    !Array.from({ length: 9 }, (_, k) => [
                      Math.floor(i / 8) + Math.floor(k / 3) - 1,
                      (i % 8) + (k % 3) - 1,
                    ]).some(
                      ([y, x]) =>
                        y >= 0 &&
                        y < 8 &&
                        x >= 0 &&
                        x < 8 &&
                        used.has(y * 8 + x),
                    ),
                )
              )
                options.push(ids);
            }
        if (!options.length) {
          good = false;
          break;
        }
        const cells = options[Math.floor(Math.random() * options.length)];
        ships.push(cells);
        cells.forEach((i) => used.add(i));
      }
      if (good) return ships;
    }
    return [
      [0, 1, 2, 3],
      [16, 17, 18],
      [40, 41, 42],
      [60, 61],
    ];
  }
  function hits(ships, shots) {
    return ships.flat().filter((i) => shots.includes(i)).length;
  }
  function newGame() {
    s = {
      own: fleet(),
      enemy: fleet(),
      shots: [],
      cpuShots: [],
      hunt: [],
      busy: false,
      due: 0,
    };
    H.reset();
    H.say("Górna plansza to radar. Dolna pokazuje Twoją flotę.");
    render();
  }
  function fire(i) {
    if (
      !H.active() ||
      s.busy ||
      !Number.isInteger(i) ||
      i < 0 ||
      i >= 64 ||
      s.shots.includes(i)
    )
      return false;
    H.start();
    s.shots.push(i);
    if (hits(s.enemy, s.shots) === 12) {
      H.record("battleships", s.shots.length, true, "strzałów");
      H.finish(`Cała flota odnaleziona. ${s.shots.length} strzałów.`);
    } else {
      s.busy = true;
      s.due = H.elapsed + 350;
      H.say(
        s.enemy.flat().includes(i)
          ? "Trafienie. Teraz strzela przeciwnik."
          : "Pudło. Teraz strzela przeciwnik.",
      );
    }
    render();
    return true;
  }
  function cpu() {
    if (!H.active() || !s.busy) return;
    let i;
    while (s.hunt.length && i === undefined) {
      const candidate = s.hunt.shift();
      if (!s.cpuShots.includes(candidate)) i = candidate;
    }
    if (i === undefined) {
      const free = Array.from({ length: 64 }, (_, j) => j).filter(
        (j) => !s.cpuShots.includes(j),
      );
      i = free[Math.floor(Math.random() * free.length)];
    }
    s.cpuShots.push(i);
    const ship = s.own.find((ship) => ship.includes(i));
    if (ship) {
      if (ship.every((j) => s.cpuShots.includes(j))) s.hunt = [];
      else s.hunt.push(...neighbors(i).filter((j) => !s.cpuShots.includes(j)));
    }
    s.busy = false;
    if (hits(s.own, s.cpuShots) === 12)
      H.finish(
        "Twoja flota została zatopiona. Nowa runda ma nowe ustawienie.",
        false,
      );
    else H.say("Twój strzał. Wybierz nieodkryte pole radaru.");
    render();
  }
  function render() {
    H.board.replaceChildren();
    for (const own of [false, true]) {
      const label = document.createElement("p");
      label.className = "th-radar-title";
      label.textContent = own ? "TWOJA FLOTA" : "RADAR — TU STRZELASZ";
      const grid = document.createElement("div");
      grid.className = "th-radar";
      const ships = own ? s.own : s.enemy,
        shots = own ? s.cpuShots : s.shots;
      for (let i = 0; i < 64; i++) {
        const ship = ships.find((ship) => ship.includes(i)),
          hit = shots.includes(i) && Boolean(ship),
          miss = shots.includes(i) && !ship,
          b = H.button(hit ? "×" : miss ? "·" : "", () => fire(i), grid);
        b.dataset.hit = String(hit);
        b.dataset.miss = String(miss);
        b.dataset.ship = String(
          Boolean(ship) &&
            (own || ship.every((j) => shots.includes(j)) || H.phase === "lost"),
        );
        b.disabled = own || shots.includes(i);
        b.setAttribute(
          "aria-label",
          `${own ? "Własne pole" : "Radar"} ${Math.floor(i / 8) + 1}, ${(i % 8) + 1}: ${hit ? "trafiony" : miss ? "pudło" : own && ship ? "okręt" : "nieodkryte"}`,
        );
      }
      H.board.append(label, grid);
    }
    H.stats([
      `${hits(s.enemy, s.shots)} / 12`,
      `${hits(s.own, s.cpuShots)} / 12`,
      s.shots.length,
    ]);
  }
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = () => {
    if (s.busy && H.elapsed >= s.due) cpu();
  };
  S.api(H, { fire, cpu, fleet, neighbors }, () => s);
  newGame();
})();
