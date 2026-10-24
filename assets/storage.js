/* Only the consent receipt is retained without an optional-storage choice. */
(() => {
  "use strict";
  const receiptKey = "spinner:consent:v1";
  const prefix = "spinner:prefs:";
  const receiptLifetime = 180 * 86400000;
  let expiryTimer = null;
  const memory = new Map();
  let changes = null;
  try {
    changes = new BroadcastChannel("spinner:preferences");
  } catch {
    /* Storage events remain available. */
  }
  let choice = null;
  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(receiptKey));
      return value &&
        value.version === 1 &&
        typeof value.preferences === "boolean" &&
        Number.isFinite(value.savedAt) &&
        Date.now() - value.savedAt >= 0 &&
        Date.now() - value.savedAt < receiptLifetime
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
  function checkExpiry() {
    if (!choice) return;
    const age = Date.now() - choice.savedAt;
    if (age >= 0 && age < receiptLifetime) return;
    choice = null;
    clearTimeout(expiryTimer);
    clearRetained();
    try {
      localStorage.removeItem(receiptKey);
    } catch {
      /* Storage may be blocked. */
    }
    window.dispatchEvent(new Event("spinner:consent-change"));
  }
  function scheduleExpiry() {
    clearTimeout(expiryTimer);
    if (!choice) return;
    expiryTimer = setTimeout(
      () => {
        checkExpiry();
        scheduleExpiry();
      },
      Math.max(
        1,
        Math.min(86400000, choice.savedAt + receiptLifetime - Date.now()),
      ),
    );
  }
  if (!choice?.preferences) clearRetained();
  scheduleExpiry();
  const preferences = {
    get(key, fallback = null) {
      checkExpiry();
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
      checkExpiry();
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
      changes?.postMessage({ type: "clear" });
    },
  };
  window.SpinnerStorage = {
    preferences,
    get consent() {
      checkExpiry();
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
      scheduleExpiry();
      window.dispatchEvent(new Event("spinner:consent-change"));
    },
  };
  window.addEventListener("storage", (event) => {
    if (event.key === null) {
      choice = readChoice();
      memory.clear();
      if (!choice?.preferences) clearRetained();
      scheduleExpiry();
      window.dispatchEvent(new Event("spinner:consent-change"));
      window.dispatchEvent(new Event("spinner:preferences-cleared"));
      return;
    }
    if (event.key?.startsWith(prefix)) {
      memory.delete(event.key.slice(prefix.length));
      return;
    }
    if (event.key !== receiptKey) return;
    choice = readChoice();
    scheduleExpiry();
    if (!choice?.preferences) {
      memory.clear();
      clearRetained();
    }
    window.dispatchEvent(new Event("spinner:consent-change"));
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkExpiry();
      scheduleExpiry();
    }
  });
  if (changes)
    changes.onmessage = (event) => {
      if (event.data?.type !== "clear") return;
      memory.clear();
      clearRetained();
      window.dispatchEvent(new Event("spinner:preferences-cleared"));
    };
})();
