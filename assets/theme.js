/* First-paint theme, shared by the salon and every nested game frame. */
(() => {
  "use strict";
  if (window.SpinnerTheme) return;
  const media = matchMedia("(prefers-color-scheme: dark)");
  const sessionKey = "spinner:theme:session";
  const palettes = {
    light: {
      paper: "#f4f1e8",
      surface: "#fffdf7",
      board: "#eae6da",
      grid: "#d8d2c4",
      ink: "#252720",
      muted: "#65675d",
      accent: "#db4723",
      blue: "#3048b8",
      green: "#4d765a",
      gold: "#a87524",
      red: "#b54633",
      violet: "#826a9d",
      pink: "#bd7d79",
      shadow: "#c8c0ad",
    },
    dark: {
      paper: "#11140f",
      surface: "#1b2018",
      board: "#171c14",
      grid: "#2d3727",
      ink: "#eeeade",
      muted: "#a9b39e",
      accent: "#ff966e",
      blue: "#a9baff",
      green: "#9fc58b",
      gold: "#e6c074",
      red: "#ed907c",
      violet: "#bfaddc",
      pink: "#e3b1b3",
      shadow: "#070a06",
    },
  };
  const valid = (value) => value === "light" || value === "dark";
  let explicit = false,
    mode = media.matches ? "dark" : "light";
  try {
    if (parent !== window && parent.SpinnerTheme) {
      mode = parent.SpinnerTheme.mode;
      explicit = true;
    } else {
      const selected = sessionStorage.getItem(sessionKey);
      if (valid(selected)) {
        mode = selected;
        explicit = true;
      } else {
        const consent = JSON.parse(localStorage.getItem("spinner:consent:v1"));
        const saved = JSON.parse(localStorage.getItem("spinner:prefs:theme"));
        if (
          consent?.preferences &&
          Date.now() - consent.savedAt < 180 * 86400000 &&
          valid(saved)
        ) {
          mode = saved;
          explicit = true;
        }
      }
    }
  } catch {
    /* Inaccessible parent or blocked storage uses the system preference. */
  }
  const colors = {
    "#000": "board",
    "#000000": "board",
    black: "board",
    "#020617": "board",
    "#050510": "board",
    "#0f172a": "surface",
    "#1e293b": "grid",
    "#334155": "grid",
    "#fff": "ink",
    "#ffffff": "ink",
    white: "ink",
    "#e5e7eb": "ink",
    "#f8fafc": "ink",
    "#cbd5e1": "ink",
    "#94a3b8": "muted",
    "#64748b": "muted",
    "#38bdf8": "accent",
    "#0ea5e9": "accent",
    "#818cf8": "blue",
    "#2563eb": "blue",
    "#1e3a8a": "blue",
    "#0000f0": "blue",
    "#00f0f0": "blue",
    "#4ade80": "green",
    "#22c55e": "green",
    "#16a34a": "green",
    "#00f000": "green",
    "#facc15": "gold",
    "#eab308": "gold",
    "#fbbf24": "gold",
    "#f0f000": "gold",
    "#f0a000": "gold",
    "#ef4444": "red",
    "#f87171": "red",
    "#fb7185": "red",
    "#dc2626": "red",
    "#f00000": "red",
    "#f97316": "accent",
    "#ec4899": "pink",
    "#f472b6": "pink",
    "#d946ef": "violet",
    "#a855f7": "violet",
    "#a78bfa": "violet",
    "#6d28d9": "violet",
    "#a000f0": "violet",
    "#2dd4bf": "green",
  };
  const paletteAliases = Object.fromEntries(
    Object.values(palettes).flatMap((palette) =>
      Object.entries(palette).map(([name, hex]) => [hex, name]),
    ),
  );
  function color(value) {
    if (typeof value !== "string") return value;
    const input = value.toLowerCase();
    const name = colors[input] || paletteAliases[input];
    if (name) return palettes[mode][name];
    const rgba = value.match(
      /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/,
    );
    if (rgba) {
      const hex =
        "#" +
        rgba
          .slice(1, 4)
          .map((n) => Number(n).toString(16).padStart(2, "0"))
          .join("");
      const mapped = color(hex);
      return rgba[4] === undefined ? mapped : alpha(mapped, Number(rgba[4]));
    }
    return value;
  }
  function alpha(name, opacity) {
    const c = palettes[mode][name] || name;
    return /^#[a-f\d]{6}$/i.test(c)
      ? c +
          Math.round(Math.max(0, Math.min(1, opacity)) * 255)
            .toString(16)
            .padStart(2, "0")
      : c;
  }
  function buttons() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const dark = mode === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute(
        "aria-label",
        dark ? "Włącz jasny motyw" : "Włącz ciemny motyw",
      );
      button.title = button.getAttribute("aria-label");
      button.innerHTML =
        (dark
          ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>'
          : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/></svg>') +
        "<span>" +
        (dark ? "Jasny" : "Ciemny") +
        "</span>";
    });
  }
  function broadcast() {
    const message = { type: "spinner:theme", mode };
    document
      .querySelectorAll("iframe")
      .forEach((frame) =>
        frame.contentWindow?.postMessage(message, location.origin),
      );
    if (parent !== window) parent.postMessage(message, location.origin);
  }
  function apply(next, remember = false) {
    if (!valid(next)) return;
    const changed = mode !== next;
    mode = next;
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    if (remember) {
      explicit = true;
      try {
        sessionStorage.setItem(sessionKey, mode);
      } catch {}
      window.SpinnerStorage?.preferences.set("theme", mode);
    }
    buttons();
    if (changed) {
      window.dispatchEvent(
        new CustomEvent("spinner:theme-change", {
          detail: { mode, palette: palettes[mode] },
        }),
      );
      broadcast();
    }
  }
  window.SpinnerTheme = {
    get mode() {
      return mode;
    },
    get palette() {
      return palettes[mode];
    },
    color,
    alpha,
    set: (next) => apply(next, true),
    drawBoard(ctx, width, height, step = 25) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = palettes[mode].board;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = palettes[mode].grid;
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      for (let x = 0; x <= width; x += step) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = 0; y <= height; y += step) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();
      ctx.restore();
    },
  };
  apply(mode);
  function attach() {
    let host =
      document.querySelector(".game-header-actions") ||
      document.querySelector(".site-header nav");
    if (!host) {
      const header = document.querySelector(".site-header");
      if (header) {
        host = document.createElement("div");
        host.className = "header-actions";
        header.append(host);
      }
    }
    if (host && !host.querySelector("[data-theme-toggle]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-toggle";
      button.dataset.themeToggle = "";
      host.prepend(button);
    }
    buttons();
    broadcast();
  }
  document.addEventListener("DOMContentLoaded", attach);
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-theme-toggle]"))
      apply(mode === "dark" ? "light" : "dark", true);
  });
  window.addEventListener("message", (event) => {
    if (
      event.origin !== location.origin ||
      event.data?.type !== "spinner:theme" ||
      !valid(event.data.mode)
    )
      return;
    apply(event.data.mode);
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "spinner:prefs:theme") {
      try {
        const next = JSON.parse(event.newValue);
        if (valid(next)) apply(next);
      } catch {}
    }
  });
  media.addEventListener("change", () => {
    if (!explicit) apply(media.matches ? "dark" : "light");
  });
  window.addEventListener("spinner:consent-change", () => {
    if (explicit && window.SpinnerStorage?.consent?.preferences)
      window.SpinnerStorage.preferences.set("theme", mode);
  });
  window.addEventListener("spinner:preferences-cleared", () => {
    try {
      sessionStorage.removeItem(sessionKey);
    } catch {}
    explicit = false;
    apply(media.matches ? "dark" : "light");
  });
})();
