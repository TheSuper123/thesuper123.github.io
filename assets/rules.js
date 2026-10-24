/* The complete text is in HTML; anchors only open the selected instructions. */
(() => {
  "use strict";
  function openSelected() {
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const section = document.getElementById(id);
    if (section?.matches("details.rules-game")) {
      section.open = true;
      requestAnimationFrame(() => section.scrollIntoView({ block: "start" }));
    }
  }
  window.addEventListener("hashchange", openSelected);
  openSelected();
})();
