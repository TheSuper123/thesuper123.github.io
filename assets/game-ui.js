(() => {
  "use strict";
  if (self !== top) document.documentElement.classList.add("embedded");
  document
    .querySelectorAll("#user-display,#user-name,#user-info")
    .forEach((el) => {
      if (!el.querySelector("input")) el.textContent = "Grasz lokalnie";
    });
  document
    .querySelectorAll("#sync-display,.sync-status")
    .forEach((el) => (el.textContent = "Zapis na urządzeniu"));
  document.querySelectorAll("footer").forEach((el) => {
    el.replaceChildren(document.createTextNode("Spinner Games · "));
    const settings = document.createElement("button");
    settings.dataset.cookieSettings = "";
    settings.textContent = "Ustawienia prywatności";
    el.append(settings);
  });
})();
