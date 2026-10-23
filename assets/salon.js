(() => {
  "use strict";
  const games = window.SpinnerGames,
    day = window.SpinnerSalonDay,
    prefs = window.SpinnerStorage.preferences;
  if (!games || !day || !document.querySelector("#odkrywaj")) return;
  const $ = (id) => document.getElementById(id),
    byId = (id) => games.find((game) => game.id === id);
  const moods = {
    slow: {
      note: "Spokojne układy, własne tempo.",
      ids: [
        "memory",
        "solitaire",
        "hanoi",
        "golf",
        "polyomino",
        "word-search",
        "twenty-four",
        "netwalk",
      ],
    },
    think: {
      note: "Tu dobry pomysł znaczy więcej niż szybki ruch.",
      ids: [
        "chess",
        "sudoku",
        "sokoban",
        "shikaku",
        "go",
        "kakuro",
        "futoshiki",
        "bridges",
      ],
    },
    quick: {
      note: "Krótka runda, ręce w gotowości.",
      ids: [
        "snake",
        "pinball",
        "invaders",
        "pong",
        "volleyball",
        "asteroids",
        "skiing",
        "rhythm",
      ],
    },
    together: {
      note: "Jedno urządzenie. Dwie strony planszy.",
      ids: [
        "connect-four",
        "artillery",
        "darts",
        "checkers",
        "backgammon",
        "reversi",
        "morris",
        "hex",
      ],
    },
  };
  let mood = "slow",
    page = 0,
    dayShown = "",
    playerGame = null,
    playerLocal = false,
    playerOrigin = null,
    frameToken = 0,
    loadTimer = null;
  const roulette = $("salon-roulette"),
    player = $("salon-player"),
    guide = $("salon-game-guide"),
    motion = matchMedia("(prefers-reduced-motion: reduce)");
  let spinning = false,
    selection = null,
    animation = 0,
    rouletteOrigin = null;
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const gamePage = (game, local = false) =>
    "gra.html?gra=" +
    encodeURIComponent(game.id) +
    (local ? "&rywal=local" : "");
  const gameLink = (game, className) => {
    const a = node("a", undefined, className);
    a.href = gamePage(game);
    a.dataset.salonPlay = game.id;
    return a;
  };
  const gameImage = (game, width, height) => {
    const image = node("img");
    image.src = "assets/art/" + game.art + ".svg";
    image.alt = "";
    image.width = width;
    image.height = height;
    image.loading = "lazy";
    return image;
  };
  function renderPicks() {
    const config = moods[mood],
      list = config.ids.map(byId).filter(Boolean),
      start = (page * 4) % list.length;
    $("salon-mood-note").textContent = config.note;
    $("salon-picks").replaceChildren();
    for (let k = 0; k < Math.min(4, list.length); k++) {
      const game = list[(start + k) % list.length],
        a = gameLink(game, "salon-pick"),
        text = node("span");
      if (mood === "together") a.href = gamePage(game, true);
      text.append(node("strong", game.name), node("small", game.tag));
      const arrow = node("span", "↗");
      arrow.setAttribute("aria-hidden", "true");
      a.append(gameImage(game, 120, 90), text, arrow);
      $("salon-picks").append(a);
    }
    document
      .querySelectorAll("[data-salon-mood]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.salonMood === mood),
        ),
      );
  }
  function renderDay() {
    const route = day.route(),
      opened = day.opened();
    if (route.day !== dayShown) {
      dayShown = route.day;
      $("salon-day-date").dateTime = route.day;
      $("salon-day-date").textContent =
        route.day.slice(8) + " / " + route.day.slice(5, 7);
      $("salon-day-games").replaceChildren();
      route.games.forEach((game, k) => {
        const li = node("li"),
          a = gameLink(game),
          number = node(
            "span",
            String(k + 1).padStart(2, "0"),
            "salon-stop-number",
          ),
          text = node("span"),
          status = node("span", "↗", "salon-stop-state");
        number.setAttribute("aria-hidden", "true");
        status.setAttribute("aria-hidden", "true");
        text.append(node("strong", game.name), node("small", "DO ODKRYCIA"));
        a.append(number, gameImage(game, 54, 43), text, status);
        li.append(a);
        $("salon-day-games").append(li);
      });
    }
    $("salon-day-games")
      .querySelectorAll("a")
      .forEach((a) => {
        const done = opened.includes(a.dataset.salonPlay);
        a.dataset.opened = String(done);
        a.querySelector("small").textContent = done
          ? "URUCHOMIONO"
          : "DO ODKRYCIA";
        a.querySelector(".salon-stop-state").textContent = done ? "✓" : "↗";
      });
    const progress =
      opened.length === 3
        ? "Komplet odkryty. Do jutra!"
        : `${opened.length} / 3 uruchomionych`;
    if ($("salon-day-progress").textContent !== progress)
      $("salon-day-progress").textContent = progress;
    $("salon-day-punches").textContent = route.games
      .map((g) => (opened.includes(g.id) ? "●" : "○"))
      .join(" ");
    document.querySelector(".salon-ticket").dataset.complete = String(
      opened.length === 3,
    );
  }
  function focusBack(origin) {
    if (
      origin?.isConnected &&
      !origin.closest("dialog:not([open])") &&
      !document.querySelector("dialog[open]")
    )
      origin.focus({ preventScroll: true });
  }
  function stopFrame() {
    frameToken++;
    clearTimeout(loadTimer);
    loadTimer = null;
    $("salon-player-stage").replaceChildren();
  }
  function loadGame() {
    stopFrame();
    const game = playerGame,
      token = frameToken,
      stage = $("salon-player-stage"),
      frame = node("iframe"),
      loading = node("div", undefined, "salon-player-loading");
    frame.id = "salon-game-frame";
    frame.title = game.name + " — szybka runda";
    frame.allow = "fullscreen";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "same-origin";
    frame.src = game.file;
    const emblem = node("span", "✳︎");
    emblem.setAttribute("aria-hidden", "true");
    loading.append(emblem, node("strong", "Chwila, rozstawiamy planszę…"));
    const direct = node("a", "Otwórz grę na osobnej stronie");
    direct.href = gamePage(game, playerLocal);
    loading.append(direct);
    stage.append(frame, loading);
    $("salon-player-restart").disabled = true;
    function failed() {
      if (token !== frameToken || !player.open) return;
      clearTimeout(loadTimer);
      loading.dataset.error = "true";
      loading.replaceChildren(
        node("span", "↻"),
        node("strong", "Plansza nie odpowiedziała."),
      );
      const retry = node("button", "Spróbuj ponownie");
      retry.onclick = loadGame;
      loading.append(retry, direct);
      $("salon-player-restart").disabled = false;
    }
    frame.addEventListener("error", failed);
    frame.addEventListener("load", () => {
      if (token !== frameToken || !player.open) return;
      try {
        const doc = frame.contentDocument;
        if (
          !doc?.body.dataset.viewportReady ||
          !doc.querySelector(".gv-board,canvas,#board")
        ) {
          failed();
          return;
        }
        if (playerLocal) {
          const opponent = doc.querySelector('select[aria-label="RYWAL"]');
          if (opponent?.querySelector('option[value="local"]')) {
            opponent.value = "local";
            opponent.dispatchEvent(
              new frame.contentWindow.Event("change", { bubbles: true }),
            );
          }
        }
        clearTimeout(loadTimer);
        loading.remove();
        $("salon-player-restart").disabled = false;
        doc.addEventListener(
          "keydown",
          (event) => {
            if (
              event.key === "Escape" &&
              !event.repeat &&
              !doc.querySelector("dialog[open]")
            ) {
              event.preventDefault();
              event.stopImmediatePropagation();
              player.close();
            }
          },
          true,
        );
        day.markOpened(game.id);
        if (game.id !== "political-compass") {
          const recent = prefs.get("recent", []);
          prefs.set(
            "recent",
            [
              game.id,
              ...(Array.isArray(recent)
                ? recent.filter((id) => id !== game.id)
                : []),
            ].slice(0, 6),
          );
          window.dispatchEvent(new Event("spinner:recent-change"));
        }
        if (
          !document.querySelector("dialog[open]:not(#salon-player)") &&
          !doc.hasFocus()
        ) {
          doc
            .querySelector('canvas,[data-game-focus],[tabindex="0"]')
            ?.focus({ preventScroll: true });
          if (!doc.hasFocus()) frame.contentWindow.focus();
        }
      } catch {
        failed();
      }
    });
    loadTimer = setTimeout(failed, 12000);
  }
  function openGame(game, origin = document.activeElement) {
    if (!game || !byId(game.id)) return false;
    if (roulette.open) roulette.close();
    playerOrigin = origin;
    playerLocal = Boolean(
      mood === "together" && origin?.closest("#salon-picks"),
    );
    playerGame = game;
    $("salon-player-title").textContent = game.name;
    $("salon-player-page").href = gamePage(game, playerLocal);
    $("salon-guide-title").textContent = game.name;
    $("salon-guide-about").textContent = game.about;
    $("salon-guide-controls").textContent = game.controls;
    const request = ++frameToken;
    if (!player.open) player.showModal();
    // Let the dialog observer pause the previous frame before creating a new one.
    queueMicrotask(() => {
      if (player.open && request === frameToken && playerGame === game)
        loadGame();
    });
    return true;
  }
  player.addEventListener("close", () => {
    if (player.open) return;
    if (guide.open) guide.close();
    stopFrame();
    playerGame = null;
    focusBack(playerOrigin);
  });
  $("salon-player-close").onclick = () => player.close();
  $("salon-player-restart").onclick = () => {
    if (playerGame) loadGame();
  };
  $("salon-player-help").onclick = () => guide.showModal();
  $("salon-player-theme").onclick = () =>
    SpinnerTheme.set(SpinnerTheme.mode === "dark" ? "light" : "dark");
  function themeLabel() {
    const dark = SpinnerTheme.mode === "dark";
    $("salon-player-theme").textContent = dark ? "☀" : "◐";
    $("salon-player-theme").title = dark ? "Jasny motyw" : "Ciemny motyw";
  }
  window.addEventListener("spinner:theme-change", themeLabel);
  themeLabel();
  function pool() {
    return window.SpinnerCatalog?.visible() || games;
  }
  const plural = new Intl.PluralRules("pl");
  const gamesWord = (count) =>
    ({ one: "gra", few: "gry", many: "gier" })[plural.select(count)] || "gier";
  function refreshRandom() {
    const count = pool().length;
    document.querySelectorAll("[data-salon-random]").forEach((button) => {
      button.disabled = !count;
      button.title = count
        ? `Losuj z bieżącego widoku (${count} ${gamesWord(count)})`
        : "Zmień wyszukiwanie lub filtr, aby znaleźć grę";
    });
  }
  function paint(game, art = true) {
    $("salon-slot-name").textContent = game.name;
    $("salon-slot-tag").textContent = game.tag;
    if (art) $("salon-slot-art").src = "assets/art/" + game.art + ".svg";
  }
  function stopSpin() {
    cancelAnimationFrame(animation);
    spinning = false;
    $("salon-slot").dataset.spinning = "false";
    $("salon-roulette-play").disabled = false;
    $("salon-roulette-again").disabled = false;
  }
  function finishSpin() {
    if (!selection) return;
    stopSpin();
    paint(selection);
    $("salon-slot-desc").textContent = selection.desc;
    $("salon-roulette-status").textContent =
      "Wylosowano: " + selection.name + ". Wybierz Gram w to, aby uruchomić.";
  }
  function spin() {
    const list = pool();
    if (!list.length || spinning) return;
    const candidates =
      list.length > 1 ? list.filter((g) => g.id !== selection?.id) : list;
    selection = candidates[Math.floor(Math.random() * candidates.length)];
    $("salon-roulette-pool").textContent =
      `Losowanie z bieżącego widoku katalogu • ${list.length} ${gamesWord(list.length)}`;
    if (motion.matches || list.length === 1) {
      finishSpin();
      return;
    }
    spinning = true;
    $("salon-slot").dataset.spinning = "true";
    $("salon-roulette-play").disabled = true;
    $("salon-roulette-again").disabled = true;
    $("salon-slot-desc").textContent =
      "Szukamy pomysłu na Twoją następną rundę…";
    $("salon-roulette-status").textContent = "Trwa losowanie gry.";
    paint(list[0]);
    const start = performance.now();
    let last = -1;
    function tick(now) {
      if (!spinning || !roulette.open) return;
      const t = Math.min(1, (now - start) / 950),
        step = Math.floor((1 - (1 - t) ** 2) * 12);
      if (step !== last) {
        last = step;
        paint(list[step % list.length], false);
      }
      if (t >= 1) finishSpin();
      else animation = requestAnimationFrame(tick);
    }
    animation = requestAnimationFrame(tick);
  }
  function openRoulette(origin) {
    if (!pool().length) return;
    rouletteOrigin = origin;
    if (!roulette.open) {
      stopSpin();
      roulette.showModal();
    }
    spin();
  }
  roulette.addEventListener("click", (event) => {
    if (event.target.closest("[data-close]")) stopSpin();
  });
  roulette.addEventListener("cancel", stopSpin);
  roulette.addEventListener("close", () => {
    if (roulette.open) return;
    stopSpin();
    focusBack(rouletteOrigin);
  });
  $("salon-roulette-again").onclick = spin;
  $("salon-roulette-play").onclick = () => {
    if (selection && !spinning) openGame(selection, rouletteOrigin);
  };
  motion.addEventListener("change", () => {
    if (motion.matches && spinning) finishSpin();
  });
  document.addEventListener("click", (event) => {
    const random = event.target.closest("[data-salon-random]");
    if (random) {
      openRoulette(random);
      return;
    }
    const button = event.target.closest("[data-salon-mood]");
    if (button) {
      mood = button.dataset.salonMood;
      page = 0;
      renderPicks();
      return;
    }
    const link = event.target.closest("a[data-salon-play]");
    if (
      link &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey &&
      event.button === 0
    ) {
      const game = byId(link.dataset.salonPlay);
      if (game) {
        event.preventDefault();
        openGame(game, link);
      }
    }
  });
  $("salon-more-picks").onclick = () => {
    page++;
    renderPicks();
  };
  window.addEventListener("spinner:catalog-change", refreshRandom);
  window.addEventListener("spinner:salon-progress", renderDay);
  window.addEventListener("spinner:preferences-cleared", renderDay);
  window.addEventListener("storage", (event) => {
    if (event.key === day.storageKey || event.key === null) renderDay();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) renderDay();
  });
  setInterval(renderDay, 60000);
  document
    .querySelectorAll("[data-salon-random]")
    .forEach((button) => (button.hidden = false));
  $("odkrywaj").hidden = false;
  document.querySelector(".salon-catalog-note").hidden = false;
  renderPicks();
  renderDay();
  refreshRandom();
  window.SpinnerSalon = {
    openGame: (id) => openGame(byId(id)),
    snapshot: () => ({
      mood,
      picks: [...$("salon-picks").querySelectorAll("a")].map(
        (a) => a.dataset.salonPlay,
      ),
      daily: day.route().games.map((g) => g.id),
      opened: day.opened(),
      selection: selection?.id || null,
      spinning,
      player: playerGame?.id || null,
    }),
  };
})();
