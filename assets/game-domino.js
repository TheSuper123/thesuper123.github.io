(() => {
  "use strict";
  const S = SpinnerThirty,
    H = S.create(["TWOJE KOSTKI", "KOSTKI RYWALA", "DOBIERANIE"]);
  H.board.className = "th-chain";
  H.board.dataset.aspect = "1.5";
  let s;
  const side = H.select(
    "KONIEC",
    [
      ["right", "Prawy"],
      ["left", "Lewy"],
    ],
    () => {},
  );
  H.button("Dobierz / pas", draw);
  const hand = document.createElement("div");
  hand.className = "th-hand";
  H.extra.append(hand);
  const legal = (tile, end) => tile.includes(end),
    pips = (tiles) => tiles.flat().reduce((a, b) => a + b, 0);
  function newGame() {
    const deck = S.shuffle(
      Array.from({ length: 7 }, (_, a) =>
        Array.from({ length: 7 - a }, (_, b) => [a, a + b]),
      ).flat(),
    );
    s = {
      hands: [deck.splice(0, 7), deck.splice(0, 7)],
      stock: deck,
      chain: [],
      busy: false,
      due: 0,
      passes: 0,
      turn: 0,
    };
    H.reset();
    H.say("Wybierz kostkę i koniec łańcucha. Dopasuj liczbę oczek.");
    render();
  }
  function available(player) {
    if (!s.chain.length) return s.hands[player].map((_, i) => i);
    const l = s.chain[0][0],
      r = s.chain.at(-1)[1];
    return s.hands[player].flatMap((tile, i) =>
      legal(tile, l) || legal(tile, r) ? [i] : [],
    );
  }
  function endCheck() {
    if (!s.hands[0].length) {
      H.finish("Wszystkie kostki wyłożone. Wygrywasz!");
      return true;
    }
    if (!s.hands[1].length) {
      H.finish("Komputer wyłożył ostatnią kostkę.", false);
      return true;
    }
    if (s.passes >= 2) {
      const a = pips(s.hands[0]),
        b = pips(s.hands[1]);
      H.finish(
        `Blokada. Twoje oczka: ${a}, rywala: ${b}. ${a === b ? "Remis." : a < b ? "Wygrywasz!" : "Wygrywa komputer."}`,
        a <= b,
      );
      return true;
    }
    return false;
  }
  function play(index, which = "right", computer = false) {
    const player = computer ? 1 : 0;
    if (
      !H.active() ||
      s.busy !== computer ||
      !Number.isInteger(index) ||
      !s.hands[player][index]
    )
      return false;
    const tile = [...s.hands[player][index]];
    if (s.chain.length) {
      const end = which === "left" ? s.chain[0][0] : s.chain.at(-1)[1];
      if (!legal(tile, end)) return false;
      if (which === "left" ? tile[1] !== end : tile[0] !== end) tile.reverse();
    }
    H.start();
    s.hands[player].splice(index, 1);
    if (which === "left") s.chain.unshift(tile);
    else s.chain.push(tile);
    s.passes = 0;
    s.busy = !computer;
    s.turn = 1 - player;
    s.due = H.elapsed + 350;
    if (!endCheck()) H.say(computer ? "Twój ruch." : "Ruch przeciwnika…");
    render();
    return true;
  }
  function draw() {
    if (!H.active() || s.busy) return false;
    if (available(0).length) {
      H.say("Masz pasującą kostkę. Zagraj ją przed dobieraniem.");
      return false;
    }
    H.start();
    if (s.stock.length) {
      s.hands[0].push(s.stock.pop());
      H.say("Kostka dobrana. Sprawdź oba końce.");
    } else {
      s.passes++;
      s.busy = true;
      s.due = H.elapsed + 350;
      if (!endCheck()) H.say("Pas. Ruch przeciwnika.");
    }
    render();
    return true;
  }
  function cpu() {
    if (!H.active() || !s.busy) return;
    while (!available(1).length && s.stock.length)
      s.hands[1].push(s.stock.pop());
    const moves = available(1);
    if (!moves.length) {
      s.passes++;
      s.busy = false;
      s.turn = 0;
      if (!endCheck()) H.say("Komputer pasuje. Twój ruch.");
      render();
      return;
    }
    const i = moves.sort(
        (a, b) => pips([s.hands[1][b]]) - pips([s.hands[1][a]]),
      )[0],
      which =
        !s.chain.length || legal(s.hands[1][i], s.chain.at(-1)[1])
          ? "right"
          : "left";
    play(i, which, true);
  }
  function tileHTML(t) {
    return `<span>${t[0]}</span><span>${t[1]}</span>`;
  }
  function render() {
    H.board.innerHTML = s.chain.length
      ? s.chain
          .map((t) => `<div class="th-domino">${tileHTML(t)}</div>`)
          .join("")
      : '<p class="ng-help">Łańcuch zacznie się od Twojej pierwszej kostki.</p>';
    hand.replaceChildren();
    s.hands[0].forEach((t, i) => {
      const b = H.button("", () => play(i, side.value), hand, "th-domino");
      b.innerHTML = tileHTML(t);
      b.setAttribute("aria-label", `Kostka ${t[0]}, ${t[1]}`);
    });
    H.stats([s.hands[0].length, s.hands[1].length, s.stock.length]);
  }
  H.onNew = newGame;
  H.onRender = render;
  H.onTick = () => {
    if (s.busy && H.elapsed >= s.due) cpu();
  };
  S.api(H, { play, draw, cpu, available, legal }, () => s);
  newGame();
})();
