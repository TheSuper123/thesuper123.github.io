/* Only the consent receipt is retained without an optional-storage choice. */
(() => {
  "use strict";
  const receiptKey = "spinner:consent:v1";
  const prefix = "spinner:prefs:";
  const memory = new Map();
  let choice = null;
  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(receiptKey));
      return value &&
        value.version === 1 &&
        typeof value.preferences === "boolean" &&
        Number.isFinite(value.savedAt) &&
        Date.now() - value.savedAt < 180 * 86400000
        ? value
        : null;
    } catch {
      return null;
    }
  }
  choice = readChoice();
  if (!choice) {
    try {
      localStorage.removeItem(receiptKey);
    } catch {
      /* No writable storage. */
    }
  }
  function clearRetained() {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      /* Private browsing can deny storage access. */
    }
  }
  if (!choice?.preferences) clearRetained();
  const preferences = {
    get(key, fallback = null) {
      if (memory.has(key)) return memory.get(key);
      if (choice?.preferences) {
        try {
          const raw = localStorage.getItem(prefix + key);
          if (raw !== null) return JSON.parse(raw);
        } catch {
          /* Fall back to this page's memory. */
        }
      }
      return fallback;
    },
    set(key, value) {
      memory.set(key, value);
      if (choice?.preferences) {
        try {
          localStorage.setItem(prefix + key, JSON.stringify(value));
        } catch {
          /* Quota or blocked storage. */
        }
      }
    },
    clear() {
      memory.clear();
      clearRetained();
      window.dispatchEvent(new Event("spinner:preferences-cleared"));
    },
  };
  window.SpinnerStorage = {
    preferences,
    get consent() {
      return choice;
    },
    choose(allowPreferences) {
      choice = {
        version: 1,
        preferences: Boolean(allowPreferences),
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(receiptKey, JSON.stringify(choice));
      } catch {
        /* Choice remains effective for this page. */
      }
      if (!choice.preferences) clearRetained();
      else for (const [key, value] of memory) preferences.set(key, value);
      window.dispatchEvent(new Event("spinner:consent-change"));
    },
  };
  window.addEventListener("storage", (event) => {
    if (event.key !== receiptKey) return;
    choice = readChoice();
    if (!choice?.preferences) {
      memory.clear();
      clearRetained();
    }
    window.dispatchEvent(new Event("spinner:consent-change"));
  });
})();
