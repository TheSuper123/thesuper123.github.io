(() => {
  "use strict";
  const id = new URLSearchParams(location.search).get("gra");
  const game = window.SpinnerGames.find((item) => item.id === id);
  if (!game && new Set(["tetris", "bird", "blocks", "doom"]).has(id)) {
    location.replace(
      new URL("others/?gra=" + encodeURIComponent(id), window.SpinnerBase),
    );
    return;
  }
  if (!game) {
    document.querySelector("#game-title").textContent = "Tej gry tu nie ma.";
    return;
  }
  document.title = game.name + " — Spinner Games";
  document.querySelector("#game-title").textContent = game.name;
  document.querySelector("#game-subtitle").textContent = game.desc;
  document.querySelector("#game-description").textContent = game.about;
  document.querySelector("#game-controls").textContent = game.controls;
  document.querySelector("#game-category").textContent = game.tag;
  document.querySelector("#game-guides").hidden = false;
  document.querySelector("#game-actions").hidden = false;
  const stage = document.querySelector("#game-stage");
  const frame = document.createElement("iframe");
  frame.title = game.name + " — rozgrywka";
  frame.src = game.file;
  frame.allow = "fullscreen";
  frame.allowFullscreen = true;
  frame.referrerPolicy = "same-origin";
  frame.addEventListener("load", () => {
    // All catalog targets are local; detect an HTTP error document rather than claiming readiness from a load event.
    try {
      if (
        !frame.contentDocument?.querySelector(
          "canvas, #game, #board, #game-frame, #gameCanvas, #game-wrapper, [data-game=fish], .grid, #grid",
        )
      )
        return;
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
  document.addEventListener(
    "fullscreenchange",
    () =>
      (document.querySelector("#fullscreen-game").textContent =
        document.fullscreenElement ? "Zamknij pełny ekran ⛶" : "Pełny ekran ⛶"),
  );
  window.addEventListener("message", (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== frame.contentWindow ||
      event.data?.type !== "spinner:game-size"
    )
      return;
    const height = Number(event.data.height);
    if (Number.isFinite(height))
      frame.style.height = Math.min(900, Math.max(400, height)) + "px";
  });
})();
