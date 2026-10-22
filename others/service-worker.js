/* No plaintext cache, password persistence, or network authentication endpoint. */
"use strict";
const SCOPE = new URL(self.registration.scope);
const CONTENT_PATH = SCOPE.pathname + "content/";
const AAD_PREFIX = "spinner-others-v1\0";
const SESSION_MS = 30 * 60 * 1000;
const PUBLIC_PATHS = new Set([
  "assets/theme.js",
  "assets/theme.css",
  "assets/site.css",
  "assets/game.css",
  "assets/mark.svg",
  "assets/storage.js",
  "assets/progress.js",
  "assets/site.js",
  "assets/game-ui.js",
  "assets/game-viewport.js",
  "assets/game-viewport.css",
  "assets/player-screen.css",
  "assets/play.js",
  "assets/fonts/sans.ttf",
  "assets/fonts/serif.ttf",
  "assets/fonts/mono.ttf",
  "prywatnosc.html",
  "o-serwisie.html",
]);
let manifestPromise;
let sessionKey = null;
let expiresAt = 0;
let ownerId = null;
let epoch = 0;
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
function manifest() {
  if (!manifestPromise)
    manifestPromise = fetch(new URL("manifest.json", SCOPE), {
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("manifest");
        return response.json();
      })
      .catch((error) => {
        manifestPromise = null;
        throw error;
      });
  return manifestPromise;
}
function lock() {
  sessionKey = null;
  expiresAt = 0;
  ownerId = null;
  manifestPromise = null;
  epoch++;
}
function active() {
  if (sessionKey && Date.now() >= expiresAt) lock();
  return Boolean(sessionKey);
}
async function liveSession() {
  if (!active() || !ownerId) return false;
  const owner = await self.clients.get(ownerId);
  if (
    !owner ||
    ![SCOPE.pathname, SCOPE.pathname + "index.html"].includes(
      new URL(owner.url).pathname,
    )
  ) {
    lock();
    return false;
  }
  return active();
}
async function decryptFile(path, key, info) {
  const item = info.files[path];
  if (!item || !/^data\/[a-f0-9]{64}(?:-[a-f0-9]{16})?\.enc$/.test(item.file))
    throw new Error("missing");
  const response = await fetch(new URL(item.file, SCOPE), {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("download");
  const encrypted = await response.arrayBuffer();
  if (encrypted.byteLength < 28) throw new Error("ciphertext");
  const data = new Uint8Array(encrypted);
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: data.subarray(0, 12),
      additionalData: new TextEncoder().encode(AAD_PREFIX + path),
      tagLength: 128,
    },
    key,
    data.subarray(12),
  );
}
self.addEventListener("message", (event) => {
  // Only documents inside this service worker's own archive scope may send session commands.
  const port = event.ports[0];
  if (!event.source?.url?.startsWith(SCOPE.href)) return;
  if (!port && event.data?.type === "LOCK") {
    lock();
    return;
  }
  if (!port) return;
  event.waitUntil(
    (async () => {
      try {
        const command = event.data?.type;
        if (command === "LOCK") {
          lock();
          port.postMessage({ ok: true });
          return;
        }
        if (command === "STATUS") {
          port.postMessage({ ok: true, unlocked: await liveSession() });
          return;
        }
        if (command !== "UNLOCK") throw new Error("command");
        const key = event.data.key;
        if (
          !key ||
          key.type !== "secret" ||
          key.algorithm?.name !== "AES-GCM" ||
          key.algorithm?.length !== 256 ||
          key.extractable
        )
          throw new Error("key");
        const generation = ++epoch;
        const info = await manifest();
        // Cryptographic verification in the worker as well: a UI-only hash comparison cannot authorize files.
        await decryptFile("index.html", key, info);
        if (generation !== epoch) throw new Error("session-changed");
        sessionKey = key;
        ownerId = event.source.id;
        expiresAt = Date.now() + SESSION_MS;
        port.postMessage({ ok: true, expiresAt });
      } catch {
        port.postMessage({ ok: false });
      }
    })(),
  );
});
const noStore = {
  "Cache-Control": "no-store, private, max-age=0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
};
function denied(status = 401) {
  return new Response(
    '<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Archiwum zablokowane</title><p>Archiwum jest zablokowane. Otwórz stronę others i wpisz hasło.</p></html>',
    {
      status,
      headers: { ...noStore, "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
async function serve(request) {
  if (!(await liveSession())) return denied();
  const key = sessionKey,
    generation = epoch;
  let path;
  try {
    path = decodeURIComponent(
      new URL(request.url).pathname.slice(CONTENT_PATH.length),
    );
  } catch {
    return denied(400);
  }
  if (
    !path ||
    path
      .split("/")
      .some((part) => part === ".." || part === "." || part.includes("\\"))
  )
    return denied(404);
  try {
    const info = await manifest();
    if (!info.files[path]) {
      if (!PUBLIC_PATHS.has(path)) return denied(404);
      const response = await fetch(new URL("../" + path, SCOPE), {
        cache: "no-store",
      });
      if (!response.ok) return denied(404);
      const buffer = await response.arrayBuffer();
      if (!active() || generation !== epoch) return denied();
      return new Response(request.method === "HEAD" ? null : buffer, {
        headers: {
          ...noStore,
          "Content-Type":
            response.headers.get("Content-Type") || "application/octet-stream",
        },
      });
    }
    const buffer = await decryptFile(path, key, info);
    if (!active() || generation !== epoch) return denied();
    const headers = {
      ...noStore,
      "Content-Type": info.files[path].mime,
      "Content-Security-Policy":
        "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' blob:; frame-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'",
    };
    return new Response(request.method === "HEAD" ? null : buffer, { headers });
  } catch {
    return denied(502);
  }
}
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(CONTENT_PATH))
    return;
  if (!["GET", "HEAD"].includes(event.request.method)) {
    event.respondWith(denied(405));
    return;
  }
  event.respondWith(serve(event.request));
});
