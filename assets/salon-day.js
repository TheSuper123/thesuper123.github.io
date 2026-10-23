/* A dated discovery route. Only successful game loads count, never victories. */
(() => {
  "use strict";
  const key = "salon:day:v1",
    prefs = window.SpinnerStorage.preferences;
  function dayKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Warsaw",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    return ["year", "month", "day"]
      .map((type) => parts.find((p) => p.type === type).value)
      .join("-");
  }
  function hash(text) {
    let h = 2166136261;
    for (const c of text) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function route(date = new Date()) {
    const day = dayKey(date),
      categories = ["logic", "arcade", "quiz"];
    return {
      day,
      games: categories
        .map((category) => {
          const pool = window.SpinnerGames.filter(
            (g) => g.category === category && g.id !== "political-compass",
          ).sort((a, b) => a.id.localeCompare(b.id, "en"));
          return pool.length
            ? pool[hash("salon-1/" + day + "/" + category) % pool.length]
            : null;
        })
        .filter(Boolean),
    };
  }
  function opened(date = new Date()) {
    const { day, games } = route(date),
      saved = prefs.get(key, null),
      eligible = new Set(games.map((g) => g.id));
    return saved?.day === day && Array.isArray(saved.opened)
      ? [...new Set(saved.opened.filter((id) => eligible.has(id)))]
      : [];
  }
  function markOpened(id, date = new Date()) {
    const { day, games } = route(date);
    if (!games.some((g) => g.id === id)) return false;
    const ids = opened(date);
    if (ids.includes(id)) return false;
    prefs.set(key, { day, opened: [...ids, id] });
    window.dispatchEvent(new Event("spinner:salon-progress"));
    return true;
  }
  window.SpinnerSalonDay = {
    dayKey,
    route,
    opened,
    markOpened,
    storageKey: "spinner:prefs:" + key,
  };
})();
