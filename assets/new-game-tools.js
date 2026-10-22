/* Small, local helpers shared by the five original game implementations. */
(() => {
  "use strict";
  const prefs = window.SpinnerStorage.preferences;
  const number = (value, fallback = 0, max = Number.MAX_SAFE_INTEGER) =>
    Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= max
      ? Number(value)
      : fallback;
  const shuffle = (items, random = Math.random) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  function clock() {
    let accumulated = 0,
      since = null;
    return {
      start() {
        if (since === null) since = performance.now();
      },
      stop() {
        if (since !== null) {
          accumulated += performance.now() - since;
          since = null;
        }
      },
      reset() {
        accumulated = 0;
        since = null;
      },
      get elapsed() {
        return accumulated + (since === null ? 0 : performance.now() - since);
      },
    };
  }
  const time = (ms) => {
    const seconds = Math.floor(Math.max(0, ms) / 1000);
    return (
      Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0")
    );
  };
  const editing = (event) =>
    Boolean(
      event.target.closest?.("input,textarea,select,[contenteditable=true]"),
    ) ||
    event.altKey ||
    event.metaKey ||
    event.ctrlKey;
  function press(element, action, repeat = false) {
    let delay = null,
      interval = null;
    const stop = () => {
      clearTimeout(delay);
      clearInterval(interval);
      delay = interval = null;
      element.removeAttribute("data-held");
    };
    element.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !event.isPrimary || element.disabled) return;
      event.preventDefault();
      stop();
      element.setPointerCapture(event.pointerId);
      element.dataset.held = "true";
      action();
      if (repeat)
        delay = setTimeout(() => {
          interval = setInterval(action, 115);
        }, 260);
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      element.addEventListener(name, stop);
    element.addEventListener("click", (event) => {
      if (event.detail === 0 && !element.disabled) action();
    });
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
    });
    return stop;
  }
  function pauses(callback) {
    window.addEventListener("blur", () => callback("blur"));
    window.addEventListener("pagehide", () => callback("hidden"));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) callback("hidden");
    });
    window.addEventListener("spinner:pause", (event) =>
      callback(event.detail?.reason || "dialog"),
    );
  }
  const names = [
    "Okrąg",
    "Trójkąt",
    "Kwadrat",
    "Gwiazda",
    "Księżyc",
    "Liść",
    "Błyskawica",
    "Kwiat",
    "Chmura",
    "Kropla",
    "Strzałka",
    "Słońce",
  ];
  const paths = [
    '<circle cx="20" cy="20" r="11"/><circle cx="20" cy="20" r="4"/>',
    '<path d="m20 7 14 25H6Z"/><path d="m20 16 7 12H13Z"/>',
    '<rect x="8" y="8" width="24" height="24" rx="2"/><path d="m12 28 16-16"/>',
    '<path d="m20 5 4 10 11 1-8 7 2 11-9-6-9 6 2-11-8-7 11-1Z"/>',
    '<path d="M27 7a14 14 0 1 0 6 22A15 15 0 0 1 27 7Z"/>',
    '<path d="M8 31C3 16 17 5 32 8c3 16-8 28-24 23Z"/><path d="m9 31 17-17m-8 8v-8m0 8h8"/>',
    '<path d="m23 4-16 21h11l-1 12 17-23H22Z"/>',
    '<circle cx="20" cy="10" r="6"/><circle cx="30" cy="20" r="6"/><circle cx="20" cy="30" r="6"/><circle cx="10" cy="20" r="6"/><circle cx="20" cy="20" r="4"/>',
    '<path d="M10 30a8 8 0 0 1-1-16 11 11 0 0 1 21-1 9 9 0 0 1 1 17Z"/>',
    '<path d="M20 5C15 14 8 20 8 27a12 12 0 0 0 24 0c0-7-7-13-12-22Z"/><path d="M14 26c0 4 2 6 6 6"/>',
    '<path d="M7 15h14V7l13 13-13 13v-8H7Z"/>',
    '<circle cx="20" cy="20" r="8"/><path d="M20 3v5m0 24v5M3 20h5m24 0h5M8 8l4 4m16 16 4 4M8 32l4-4m16-16 4-4"/>',
  ];
  const symbol = (index) =>
    `<svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[index % paths.length]}</svg>`;
  window.SpinnerNew = {
    prefs,
    number,
    shuffle,
    clock,
    time,
    editing,
    press,
    pauses,
    names,
    symbol,
  };
})();
