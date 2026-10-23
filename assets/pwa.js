/* Installation is manual on iOS. Downloaded files contain no account or game data. */
(() => {
  "use strict";
  if (self !== top) return;
  const base = new URL("../", document.currentScript.src);
  const $ = (selector) => document.querySelector(selector);
  const downloadError =
    "Nie udało się pobrać wszystkich plików. Sprawdź połączenie i wolne miejsce, a potem dokończ pobieranie — gotowe pliki zostają na urządzeniu.";
  let feedbackTitle = "";
  let registration,
    state,
    busy = false,
    reloading = false,
    error = "";
  const supported =
    isSecureContext && "serviceWorker" in navigator && "caches" in window;
  const installed = () =>
    matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;
  const formatSize = (bytes) =>
    new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(
      bytes / 1048576,
    );

  function render() {
    $('meta[name="theme-color"]')?.setAttribute(
      "content",
      window.SpinnerTheme?.palette.paper || "#f4f1e8",
    );
    document.documentElement.classList.toggle("app-standalone", installed());
    document
      .querySelectorAll("[data-app-installed]")
      .forEach((el) => (el.hidden = !installed()));
    document.querySelectorAll("[data-network-state]").forEach((el) => {
      el.hidden = navigator.onLine;
      el.textContent = state?.ready
        ? "Offline — 100 gier pod ręką"
        : "Offline — dostępne są wcześniej pobrane gry";
    });
    const title = $("#offline-title");
    if (!title) return;
    const downloading = busy || state?.downloading;
    title.textContent = !supported
      ? "Ta przeglądarka nie obsługuje trybu offline."
      : feedbackTitle
        ? feedbackTitle
        : error
          ? "Sprawdź stan pobierania."
          : downloading
            ? "Pakujemy Twój salon…"
            : state?.ready
              ? "Gotowe. Możesz odłączyć internet."
              : !navigator.onLine
                ? "Połącz się, żeby dokończyć pobieranie."
                : state
                  ? "Zabierz wszystkie 100 gier."
                  : "Przygotowujemy aplikację…";
    $("#offline-detail").textContent =
      error ||
      (!supported
        ? "Otwórz tę stronę w Safari na iPhonie, korzystając z adresu HTTPS."
        : state?.ready
          ? "Cały publiczny katalog, ilustracje i zasady są na tym urządzeniu. Logowanie i archiwum Others wymagają internetu."
          : downloading
            ? "Zostaw tę stronę otwartą. Możesz przerwać i dokończyć później."
            : state
              ? `Około ${formatSize(state.bytes)} MB. Zapisujemy pliki gier na urządzeniu, bez odpowiedzi z testów i danych konta.`
              : "Pierwsze przygotowanie wymaga internetu. Gry i ich zapis pozostają osobnymi ustawieniami.");
    const progress = $("#offline-progress");
    progress.max = state?.total || 1;
    progress.value = state?.completed || 0;
    progress.hidden = !state;
    $("#offline-count").textContent = state
      ? `${state.completed} / ${state.total} plików${state.ready ? " · 100 gier" : ""}`
      : "";
    const button = $("#offline-download");
    button.disabled =
      !supported ||
      !registration?.active ||
      downloading ||
      !navigator.onLine ||
      Boolean(state?.ready);
    button.textContent = state?.ready
      ? "100 gier pobranych ✓"
      : state?.completed
        ? "Dokończ pobieranie 100 gier ↓"
        : "Pobierz 100 gier offline ↓";
    $("#offline-cancel").hidden = !downloading;
    $("#offline-clear").disabled =
      !registration?.active || downloading || !state?.completed;
    $("#offline-panel").setAttribute("aria-busy", String(Boolean(downloading)));
    $("#offline-retry").hidden =
      !error || Boolean(registration?.active) || !supported;
  }

  function message(type, target = registration?.active) {
    return new Promise((resolve, reject) => {
      if (!target) return reject(new Error("not-ready"));
      const channel = new MessageChannel();
      // The worker may take several minutes on a slow connection; progress arrives separately.
      const timer = setTimeout(
        () => {
          channel.port1.close();
          reject(new Error("timeout"));
        },
        type === "DOWNLOAD" ? 10 * 60 * 1000 : 20000,
      );
      channel.port1.onmessage = (event) => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(event.data);
      };
      target.postMessage({ type }, [channel.port2]);
    });
  }

  async function refresh() {
    if (!registration?.active) return;
    try {
      state = await message("STATUS");
    } catch {
      /* A suspended worker can be retried. */
    }
    render();
  }

  function offerUpdate() {
    const box = $("#app-update");
    if (box) box.hidden = !registration?.waiting;
  }

  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (
      event.data?.type !== "spinner:offline-progress" ||
      event.source !== registration?.active
    )
      return;
    state = event.data;
    if (state.failed) error = downloadError;
    render();
  });
  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (reloading) location.reload();
    else refresh();
  });
  window.addEventListener("online", () => {
    error = "";
    feedbackTitle = "";
    refresh();
    render();
  });
  window.addEventListener("offline", render);
  window.addEventListener("spinner:theme-change", render);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refresh();
      offerUpdate();
    }
  });
  matchMedia("(display-mode: standalone)").addEventListener("change", render);
  $("#offline-download")?.addEventListener("click", async () => {
    busy = true;
    error = "";
    feedbackTitle = "";
    render();
    try {
      state = await message("DOWNLOAD");
      if (!state.ok) error = downloadError;
      else if (state.ready && navigator.storage?.persist) {
        // Best effort only: iOS may still clear storage. Never promise permanent retention.
        navigator.storage.persist().catch(() => {});
      }
    } catch {
      error =
        "Pobieranie nie zostało potwierdzone. Odśwież stronę i dokończ je przy połączeniu z internetem.";
    } finally {
      busy = false;
      render();
    }
  });
  $("#offline-cancel")?.addEventListener("click", async () => {
    try {
      state = await message("CANCEL");
      feedbackTitle = "Pobieranie wstrzymane.";
      error =
        "Pobieranie wstrzymane. Pobrane pliki zostają; możesz dokończyć później.";
    } catch {
      error =
        "Nie udało się potwierdzić zatrzymania. Odśwież stronę, żeby sprawdzić stan.";
    }
    busy = false;
    render();
  });
  $("#offline-clear")?.addEventListener("click", () =>
    $("#offline-remove-dialog").showModal(),
  );
  $("#offline-remove-confirm")?.addEventListener("click", async () => {
    $("#offline-remove-dialog").close();
    busy = true;
    render();
    try {
      state = await message("CLEAR");
      feedbackTitle = "Pliki aplikacji zostały usunięte.";
      error =
        "Pobrane pliki aplikacji usunięte. Przy kolejnych odwiedzinach otwierane gry będą znów zapisywane do działania offline. Wyniki, ulubione i sesja konta pozostają bez zmian.";
    } catch {
      error = "Nie udało się usunąć plików. Spróbuj ponownie.";
    }
    busy = false;
    render();
  });
  $("#app-update-button")?.addEventListener("click", async () => {
    if (!registration?.waiting) return;
    reloading = true;
    try {
      await message("ACTIVATE", registration.waiting);
    } catch {
      reloading = false;
      window.spinnerToast?.(
        "Nie udało się zastosować aktualizacji. Spróbuj ponownie.",
      );
    }
  });

  $("#offline-retry")?.addEventListener("click", () => location.reload());
  render();
  if (!supported) return;
  (async () => {
    try {
      registration = await navigator.serviceWorker.register(
        new URL("service-worker.js", base),
        { scope: base.pathname, updateViaCache: "none" },
      );
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") offerUpdate();
        });
      });
      // An existing active worker is usable even while a new version installs.
      if (!registration.active)
        await new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("setup-timeout")),
            45000,
          );
          navigator.serviceWorker.ready.then(() => {
            clearTimeout(timer);
            resolve();
          });
          const worker = registration.installing;
          const check = () => {
            if (worker?.state === "redundant") {
              clearTimeout(timer);
              reject(new Error("setup-failed"));
            }
          };
          worker?.addEventListener("statechange", check);
          check();
        });
      await refresh();
      offerUpdate();
    } catch {
      error =
        "Nie udało się przygotować aplikacji. Sprawdź połączenie, wyłącz tryb prywatny lub spróbuj ponownie w Safari. Strona nadal działa online.";
      render();
    }
  })();
})();
