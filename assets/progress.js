/* Local game saves. This adapter never contacts Firebase or interprets a nickname as identity. */
(() => {
  "use strict";
  const prefs = window.SpinnerStorage.preferences;
  const key = "game:" + location.pathname.split("/").filter(Boolean).join("/");
  const listeners = new Set();
  const clone = (value) =>
    value === undefined ? null : JSON.parse(JSON.stringify(value));
  function parts(path) {
    const items = path.split("/").filter(Boolean);
    if (
      items.some((item) =>
        ["__proto__", "constructor", "prototype"].includes(item),
      )
    )
      throw new Error("Invalid save path");
    return items;
  }
  function get(path) {
    return parts(path).reduce(
      (value, part) => value?.[part],
      prefs.get(key, {}),
    );
  }
  function snapshot(path) {
    const value = clone(get(path));
    return { exists: () => value !== null, val: () => clone(value) };
  }
  function write(path, value) {
    const data = clone(prefs.get(key, {}));
    const keys = parts(path);
    let parent = data;
    for (const part of keys.slice(0, -1)) {
      if (!parent[part] || typeof parent[part] !== "object") parent[part] = {};
      parent = parent[part];
    }
    if (value === null) delete parent[keys.at(-1)];
    else parent[keys.at(-1)] = clone(value);
    prefs.set(key, data);
    for (const listener of listeners) listener();
    return Promise.resolve();
  }
  window.ArcadeProgress = {
    playerId: "local",
    onReady: (callback) => queueMicrotask(callback),
    database: () => ({
      ref: (path) => ({
        once: () => Promise.resolve(snapshot(path)),
        on: (_event, callback) => {
          const listener = () => callback(snapshot(path));
          listeners.add(listener);
          queueMicrotask(listener);
          return listener;
        },
        set: (value) => write(path, value),
        update: (values) => write(path, Object.assign({}, get(path), values)),
        remove: () => write(path, null),
      }),
    }),
  };
})();
