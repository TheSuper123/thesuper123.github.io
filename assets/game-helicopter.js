(() => {
  "use strict";
  const S = SpinnerHundred,
    W = 720,
    T = 480;
  function corridor(distance) {
    const center =
        240 + Math.sin(distance / 270) * 90 + Math.sin(distance / 660) * 30,
      gap = 132;
    return { top: center - gap, bottom: center + gap };
  }
  S.arcade({
    labels: ["METRY", "CEL", "PRĘDKOŚĆ"],
    binds: [["Wirnik ↑", "lift", ["ArrowUp", "w", "W", " "]]],
    initial: () => ({ y: 240, vy: 0, distance: 0, speed: 145 }),
    stats: (s) => [Math.floor(s.distance), "2500 m", Math.round(s.speed)],
    update(s, Q, dt) {
      s.distance += s.speed * dt;
      s.speed = Math.min(230, 145 + s.distance * 0.025);
      s.vy += (Q.keys.has("lift") ? -390 : 290) * dt;
      s.vy = S.clamp(s.vy, -190, 210);
      s.y += s.vy * dt;
      const bounds = corridor(s.distance + 150);
      if (s.y - 13 < bounds.top || s.y + 13 > bounds.bottom)
        Q.H.finish(
          `Ściana jaskini. Przelot: ${Math.floor(s.distance)} m.`,
          false,
        );
      else if (s.distance >= 2500)
        Q.H.finish("Przelot ukończony. 2500 metrów przez jaskinię!");
    },
    draw(s, Q, p) {
      const c = Q.ctx;
      c.fillStyle = p.ink;
      c.beginPath();
      c.moveTo(0, 0);
      for (let x = 0; x <= W; x += 5) c.lineTo(x, corridor(s.distance + x).top);
      c.lineTo(W, 0);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(0, T);
      for (let x = 0; x <= W; x += 5)
        c.lineTo(x, corridor(s.distance + x).bottom);
      c.lineTo(W, T);
      c.closePath();
      c.fill();
      c.fillStyle = p.accent;
      c.fillRect(133, s.y - 9, 34, 18);
      c.fillRect(116, s.y - 3, 20, 5);
      c.strokeStyle = p.accent;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(127, s.y - 16);
      c.lineTo(173, s.y - 16);
      c.moveTo(141, s.y - 15);
      c.lineTo(141, s.y - 8);
      c.stroke();
      c.fillStyle = p.gold;
      c.fillRect(158, s.y - 6, 6, 9);
    },
    hint: "Przytrzymuj wirnik, aby wznieść śmigłowiec. Po puszczeniu opada z bezwładnością. Jaskinia ma ciągłe ściany, a prędkość stopniowo rośnie. Cel: 2500 metrów.",
  });
  MoreGame.corridor = corridor;
})();
