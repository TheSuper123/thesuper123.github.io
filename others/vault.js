(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const base = new URL("./", document.currentScript.src);
  const decoder = (value) =>
    Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  let worker,
    metadata,
    busy = false,
    timer = null;
  function status(text, error = false) {
    $("#vault-message").textContent = text;
    $("#vault-message").classList.toggle("error", error);
  }
  function command(type, key) {
    return new Promise((resolve, reject) => {
      if (!worker) {
        reject(new Error("worker"));
        return;
      }
      const channel = new MessageChannel();
      const timeout = setTimeout(() => {
        channel.port1.close();
        reject(new Error("timeout"));
      }, 10000);
      channel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        channel.port1.close();
        resolve(event.data);
      };
      worker.postMessage({ type, ...(key ? { key } : {}) }, [channel.port2]);
    });
  }
  function hideArchive() {
    document.body.classList.remove("vault-playing");
    $(".vault-session").append($("#lock-button"));
    clearTimeout(timer);
    $("#archive-container").replaceChildren();
    $("#unlocked-view").hidden = true;
    $("#locked-view").hidden = false;
    $("#unlock-form").reset();
    $("#vault-password").type = "password";
    $("#toggle-password").textContent = "Pokaż";
    $("#toggle-password").setAttribute("aria-pressed", "false");
  }
  async function lock() {
    hideArchive();
    if (worker) await command("LOCK").catch(() => {});
    status("Archiwum zablokowane.");
  }
  $("#lock-button").onclick = lock;
  $("#toggle-password").onclick = () => {
    const visible = $("#vault-password").type === "password";
    $("#vault-password").type = visible ? "text" : "password";
    $("#toggle-password").textContent = visible ? "Ukryj" : "Pokaż";
    $("#toggle-password").setAttribute(
      "aria-label",
      visible ? "Ukryj hasło" : "Pokaż hasło",
    );
    $("#toggle-password").setAttribute("aria-pressed", String(visible));
  };
  async function initialize() {
    if (!isSecureContext || !crypto?.subtle || !("serviceWorker" in navigator))
      throw new Error("unsupported");
    const response = await fetch(new URL("manifest.json", base), {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("manifest");
    metadata = await response.json();
    if (
      metadata.version !== 1 ||
      metadata.kdf?.name !== "PBKDF2-SHA-256" ||
      metadata.kdf.iterations !== 600000
    )
      throw new Error("format");
    const registration = await navigator.serviceWorker.register(
      new URL("service-worker.js", base),
      { scope: base.pathname, updateViaCache: "none" },
    );
    await navigator.serviceWorker.ready;
    worker = registration.active;
    if (!worker) throw new Error("worker");
    // Opening/reloading the gate starts locked. There is no remembered password or persisted key.
    await command("LOCK");
    $("#unlock-button").disabled = false;
    status("");
  }
  $("#unlock-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !worker || !metadata) return;
    busy = true;
    $("#unlock-button").disabled = true;
    status("Sprawdzanie hasła i odszyfrowywanie…");
    let raw, bytes;
    try {
      bytes = new TextEncoder().encode($("#vault-password").value);
      const passwordKey = await crypto.subtle.importKey(
        "raw",
        bytes,
        "PBKDF2",
        false,
        ["deriveBits"],
      );
      bytes.fill(0);
      raw = new Uint8Array(
        await crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: decoder(metadata.kdf.salt),
            iterations: metadata.kdf.iterations,
          },
          passwordKey,
          512,
        ),
      );
      const verifier = new Uint8Array(
        await crypto.subtle.digest("SHA-256", raw.subarray(32)),
      );
      const expected = decoder(metadata.verifier);
      let mismatch = verifier.length ^ expected.length;
      for (let i = 0; i < verifier.length; i++)
        mismatch |= verifier[i] ^ (expected[i] || 0);
      if (mismatch) {
        $("#vault-password").value = "";
        status("Nieprawidłowe hasło.", true);
        return;
      }
      const key = await crypto.subtle.importKey(
        "raw",
        raw.subarray(0, 32),
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );
      raw.fill(0);
      raw = null;
      const result = await command("UNLOCK", key);
      if (!result.ok) throw new Error("decrypt");
      $("#unlock-form").reset();
      $("#locked-view").hidden = true;
      $("#unlocked-view").hidden = false;
      document.body.classList.add("vault-playing");
      $(".site-header").append($("#lock-button"));
      const frame = document.createElement("iframe");
      frame.id = "archive-frame";
      frame.title = "Others — odszyfrowane archiwum";
      frame.allowFullscreen = true;
      frame.allow = "fullscreen";
      frame.referrerPolicy = "same-origin";
      const requested = new URLSearchParams(location.search).get("gra");
      const allowed = new Set([
        "tetris",
        "bird",
        "blocks",
        "doom",
        "geometry-lite",
        "skibidi-fish",
      ]);
      frame.src = new URL(
        allowed.has(requested)
          ? "content/gra.html?gra=" + encodeURIComponent(requested)
          : "content/index.html",
        base,
      );
      $("#archive-container").replaceChildren(frame);
      timer = setTimeout(lock, Math.max(0, result.expiresAt - Date.now()));
    } catch {
      status(
        "Nie udało się otworzyć archiwum. Sprawdź połączenie i spróbuj ponownie.",
        true,
      );
    } finally {
      $("#vault-password").value = "";
      raw?.fill(0);
      bytes?.fill(0);
      busy = false;
      $("#unlock-button").disabled = false;
    }
  });
  window.addEventListener("pagehide", () => {
    hideArchive();
    if (worker) worker.postMessage({ type: "LOCK" }, []);
  });
  // A one-way LOCK is intentionally supported separately in the worker for pagehide.
  initialize().catch((error) =>
    status(
      error.message === "unsupported"
        ? "Potrzebna jest aktualna przeglądarka oraz HTTPS (lub localhost podczas pracy lokalnej)."
        : "Nie udało się przygotować archiwum. Odśwież stronę lub sprawdź połączenie.",
      true,
    ),
  );
})();
