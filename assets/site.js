(() => {
  "use strict";
  const base = new URL("../", document.currentScript.src);
  window.SpinnerBase = base;
  window.spinnerToast = (message) => {
    document.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.append(toast);
    setTimeout(() => toast.remove(), 4500);
  };
  document
    .querySelectorAll("[data-year]")
    .forEach((el) => (el.textContent = new Date().getFullYear()));
  if (window.self !== window.top) return;
  const storage = window.SpinnerStorage;
  if (!storage) return;
  const panel = document.createElement("aside");
  panel.className = "cookie-panel";
  panel.setAttribute("aria-labelledby", "cookie-title");
  panel.innerHTML = `<div class="dialog-kicker">TWOJA PRZEGLĄDARKA, TWOJE ZASADY</div><h2 id="cookie-title">Mały zapis. Twój wybór.</h2><p>Bez reklam i analityki. Za Twoją zgodą zapamiętamy ulubione gry i wyniki na tym urządzeniu. Bez zgody działają do zamknięcia strony. Logowanie uruchamiasz osobno. <a href="${new URL("prywatnosc.html", base).href}">Polityka prywatności</a></p><div class="cookie-actions"><button class="button" data-choice="no">Tylko niezbędne</button><button class="button" data-choice="yes">Zezwól na zapis</button></div><button class="cookie-settings-link" data-cookie-settings>Dostosuj ustawienia</button>`;
  panel.hidden = Boolean(storage.consent);
  document.body.append(panel);
  const dialog = document.createElement("dialog");
  dialog.id = "cookie-dialog";
  dialog.setAttribute("aria-labelledby", "cookie-dialog-title");
  dialog.innerHTML = `<button class="dialog-close" data-close aria-label="Zamknij ustawienia cookies">×</button><div class="dialog-kicker">PRYWATNOŚĆ</div><h2 id="cookie-dialog-title">Ty decydujesz.</h2><p>Nie używamy reklamowych ani analitycznych plików cookies. Zapis dotyczy również pamięci localStorage.</p><div class="preference-row"><div>Niezbędne<small>Zapamiętanie tej decyzji przez 180 dni i sesja logowania, jeśli o nią poprosisz.</small></div><span>Zawsze aktywne</span></div><label class="preference-row"><div>Preferencje i wyniki<small>Ulubione, ostatnio grane i lokalny zapis postępu. Możesz je usunąć w każdej chwili.</small></div><input id="cookie-preferences" type="checkbox"></label><p>Cofnięcie zgody usuwa zachowane preferencje. Konta Firebase nie są przez to usuwane.</p><button class="button primary full-width" id="save-cookies">Zapisz mój wybór <span>↗</span></button>`;
  document.body.append(dialog);
  document.addEventListener("click", (event) => {
    const settings = event.target.closest("[data-cookie-settings]");
    if (settings) {
      dialog.querySelector("input").checked = Boolean(
        storage.consent?.preferences,
      );
      dialog.showModal();
    }
    if (event.target.closest("[data-close]"))
      event.target.closest("dialog")?.close();
    const choice = event.target.closest("[data-choice]");
    if (choice) storage.choose(choice.dataset.choice === "yes");
    if (event.target.closest("[data-clear-preferences]")) {
      storage.preferences.clear();
      window.spinnerToast(
        "Zapisane na urządzeniu preferencje zostały usunięte.",
      );
    }
  });
  dialog.querySelector("#save-cookies").addEventListener("click", () => {
    storage.choose(dialog.querySelector("input").checked);
    dialog.close();
    window.spinnerToast("Ustawienia zapisane.");
  });
  window.addEventListener(
    "spinner:consent-change",
    () => (panel.hidden = Boolean(storage.consent)),
  );
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
      !document.querySelector("dialog[open]")
    ) {
      const search = document.querySelector("#game-search");
      if (search) {
        event.preventDefault();
        search.focus();
      }
    }
  });
})();
