(() => {
  "use strict";
  const id = new URLSearchParams(location.search).get("gra");
  const game = window.SpinnerGames.find((item) => item.id === id);
  if (
    !game &&
    new Set([
      "tetris",
      "bird",
      "blocks",
      "doom",
      "geometry-lite",
      "skibidi-fish",
    ]).has(id)
  ) {
    location.replace(
      new URL("others/?gra=" + encodeURIComponent(id), window.SpinnerBase),
    );
    return;
  }
  if (!game) {
    document.querySelector("#game-title").textContent = "Tej gry tu nie ma.";
    return;
  }
  // Older encrypted archive wrappers also use this shared player.
  if (!document.querySelector("#player-guide")) {
    const oldStage = document.querySelector("#game-stage"),
      main = document.querySelector("#main");
    if (oldStage && main) {
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = new URL("assets/player-screen.css", window.SpinnerBase);
      document.head.append(style);
      document.body.classList.add("player-page");
      main.replaceChildren(oldStage);
      const header = document.createElement("header");
      header.className = "site-header player-bar";
      header.innerHTML =
        '<a class="player-home" href="index.html" aria-label="Archiwum others">←</a><h1 id="game-title"></h1><nav class="player-tools" aria-label="Narzędzia gry"><div id="game-actions" hidden><button id="restart-game" aria-label="Od początku">↻</button><button id="fullscreen-game" aria-label="Pełny ekran">⛶</button></div><button id="player-help" aria-label="Zasady i sterowanie">?</button></nav>';
      document.body.prepend(header);
      const dialog = document.createElement("dialog");
      dialog.id = "player-guide";
      dialog.setAttribute("aria-label", "Zasady i sterowanie");
      dialog.innerHTML =
        '<button class="dialog-close" data-close aria-label="Zamknij zasady">×</button><p id="game-category"></p><div id="game-guides" hidden><h2 id="game-subtitle"></h2><p id="game-description"></p><h3>Sterowanie</h3><p id="game-controls"></p></div>';
      document.body.append(dialog);
    }
  }
  document.title = game.name + " — Spinner Games";
  document.querySelector("#game-title").textContent = game.name;
  document.querySelector("#game-subtitle").textContent = game.desc;
  document.querySelector("#game-description").textContent = game.about;
  document.querySelector("#game-controls").textContent = game.controls;
  document.querySelector("#game-category").textContent = game.tag;
  document.querySelector("#game-guides").hidden = false;
  document.querySelector("#game-actions").hidden = false;
  const guide = document.querySelector("#player-guide");
  document.querySelector("#player-help").onclick = () => guide.showModal();
  guide.querySelector("[data-close]").onclick = () => guide.close();
  const stage = document.querySelector("#game-stage");
  const frame = document.createElement("iframe");
  frame.title = game.name + " — rozgrywka";
  frame.src = game.file;
  frame.allow = "fullscreen";
  frame.allowFullscreen = true;
  frame.referrerPolicy = "same-origin";
  const failed = () => {
    const placeholder = document.querySelector("#game-placeholder");
    if (!placeholder) return;
    placeholder.replaceChildren("Nie udało się uruchomić gry. ");
    const retry = document.createElement("button");
    retry.className = "link-button";
    retry.textContent = "Spróbuj ponownie";
    retry.addEventListener("click", () => {
      placeholder.replaceChildren("Ponowne uruchamianie…");
      frame.src = game.file;
    });
    placeholder.append(retry);
  };
  frame.addEventListener("error", failed);
  frame.addEventListener("load", () => {
    // All catalog targets are local; detect an HTTP error document rather than claiming readiness from a load event.
    try {
      if (
        !frame.contentDocument?.querySelector(
          "canvas, #game, #board, #game-frame, #gameCanvas, #game-wrapper, [data-game=fish], .grid, #grid",
        )
      ) {
        failed();
        return;
      }
      document.querySelector("#game-placeholder")?.remove();
    } catch {
      /* Browser access restrictions leave the direct link available. */
    }
  });
  const placeholder = document.querySelector("#game-placeholder");
  placeholder.textContent = "Ładowanie gry… ";
  const direct = document.createElement("a");
  direct.href = game.file;
  direct.textContent = "Otwórz grę osobno";
  placeholder.append(direct);
  stage.prepend(frame);
  const prefs = window.SpinnerStorage.preferences;
  const recent = prefs.get("recent", []);
  if (game.id !== "political-compass")
    prefs.set(
      "recent",
      [
        game.id,
        ...(Array.isArray(recent)
          ? recent.filter((item) => item !== game.id)
          : []),
      ].slice(0, 6),
    );
  document.querySelector("#restart-game").addEventListener("click", () => {
    frame.src = game.file;
  });
  document
    .querySelector("#fullscreen-game")
    .addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (stage.requestFullscreen) await stage.requestFullscreen();
        else {
          window.spinnerToast(
            "Ta przeglądarka nie udostępnia pełnego ekranu. Otwórz grę osobno.",
          );
        }
      } catch {
        window.spinnerToast(
          "Nie udało się włączyć pełnego ekranu. Otwórz grę osobno.",
        );
      }
    });
  document.addEventListener("fullscreenchange", () => {
    const button = document.querySelector("#fullscreen-game"),
      active = Boolean(document.fullscreenElement);
    button.textContent = active ? "↙" : "⛶";
    button.setAttribute(
      "aria-label",
      active ? "Zamknij pełny ekran" : "Pełny ekran",
    );
    button.title = button.getAttribute("aria-label");
  });
  // The iframe follows the available viewport. Content never enlarges the page.
})();
