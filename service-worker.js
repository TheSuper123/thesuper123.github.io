/* Public static files only. /others/ has a separate, private worker and policy. */
"use strict";
importScripts("assets/offline-pack.js");
const PACK = self.SpinnerOfflinePack;
const BASE = new URL(self.registration.scope);
const PREFIX = "spinner-public-" + encodeURIComponent(BASE.pathname) + "-";
const CACHE = PREFIX + PACK.version;
const COMPLETE = new URL("__spinner-offline-complete__", BASE).href;
const urls = new Set(PACK.files.map((path) => new URL(path, BASE).href));
let download = null;
let downloadAbort = null;

function canonical(input) {
  const url = new URL(input);
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname))
    return null;
  url.search = "";
  url.hash = "";
  if (url.pathname === BASE.pathname) url.pathname += "index.html";
  return urls.has(url.href) ? url.href : null;
}

async function store(cache, url, signal) {
  const response = await fetch(url, {
    cache: "reload",
    credentials: "omit",
    redirect: "error",
    signal,
  });
  if (!response.ok || response.type === "opaque")
    throw new Error("download-failed");
  // Do not turn a hosting error document into a supposedly downloaded engine.
  const mime = response.headers.get("content-type") || "";
  if (
    (/\.(js|css|json|png|svg|ttf)$/.test(url) && mime.includes("text/html")) ||
    (url.endsWith(".html") && !mime.includes("text/html"))
  )
    throw new Error("invalid-file");
  await cache.put(url, response.clone());
  return response;
}

async function status() {
  const cache = await caches.open(CACHE);
  const present = new Set((await cache.keys()).map((request) => request.url));
  const completed = [...urls].filter((url) => present.has(url)).length;
  return {
    version: PACK.version,
    completed,
    total: urls.size,
    ready: completed === urls.size,
    downloading: Boolean(download),
    games: PACK.games,
    bytes: PACK.bytes,
  };
}

async function notify(state) {
  for (const client of await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  })) {
    if (
      client.url.startsWith(BASE.href) &&
      !client.url.startsWith(new URL("others/", BASE).href)
    )
      client.postMessage({ type: "spinner:offline-progress", ...state });
  }
}

async function fetchPack() {
  const cache = await caches.open(CACHE);
  const present = new Set((await cache.keys()).map((request) => request.url));
  const pending = [...urls].filter((url) => !present.has(url));
  let completed = urls.size - pending.length;
  const signal = downloadAbort.signal;
  const progress = () =>
    notify({
      version: PACK.version,
      completed,
      total: urls.size,
      ready: completed === urls.size,
      downloading: true,
      games: PACK.games,
      bytes: PACK.bytes,
    });
  await progress();
  let failure;
  // A failed or interrupted transfer keeps valid files for the next attempt.
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (pending.length && !signal.aborted && !failure) {
        const url = pending.shift();
        try {
          await store(cache, url, signal);
          completed++;
          if (completed % 8 === 0 || completed === urls.size) await progress();
        } catch (error) {
          failure = error;
        }
      }
    }),
  );
  if (failure || signal.aborted)
    throw failure || new Error("download-cancelled");
  await cache.put(
    COMPLETE,
    new Response(JSON.stringify({ ready: true }), {
      headers: { "Content-Type": "application/json" },
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Update previously downloaded games too, before replacing the active worker.
      // Closing every app window must not silently discard a complete offline pack.
      const targets = new Set(
        PACK.core.map((path) => new URL(path, BASE).href),
      );
      let fullPack = false;
      for (const name of await caches.keys()) {
        if (!name.startsWith(PREFIX) || name === CACHE) continue;
        const previous = await caches.open(name);
        if (await previous.match(COMPLETE)) fullPack = true;
        for (const request of await previous.keys())
          if (urls.has(request.url)) targets.add(request.url);
      }
      if (fullPack) for (const url of urls) targets.add(url);
      const pending = [...targets];
      await Promise.all(
        Array.from({ length: 4 }, async () => {
          while (pending.length) await store(cache, pending.shift());
        }),
      );
      if (fullPack)
        await cache.put(
          COMPLETE,
          new Response('{"ready":true}', {
            headers: { "Content-Type": "application/json" },
          }),
        );
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith(PREFIX) && name !== CACHE)
          await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const key = canonical(event.request.url);
  // No interception or caching of accounts, external requests or private archive.
  if (!key) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(key);
      if (hit) return hit;
      try {
        return await store(cache, key);
      } catch {
        if (event.request.mode === "navigate") {
          const fallback = await cache.match(
            new URL("offline.html", BASE).href,
          );
          if (fallback)
            return new Response(
              (await fallback.text()).replace(
                "<head>",
                `<head><base href="${BASE.href}">`,
              ),
              {
                headers: {
                  "Content-Type": "text/html; charset=utf-8",
                  "Cache-Control": "no-store",
                },
              },
            );
        }
        return new Response(
          "Ten plik nie został jeszcze pobrany. Połącz się z internetem i pobierz gry offline.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
            },
          },
        );
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  const port = event.ports[0];
  const source = event.source;
  // The encrypted archive cannot command the public cache manager.
  if (
    !source?.url?.startsWith(BASE.href) ||
    source.url.startsWith(new URL("others/", BASE).href)
  )
    return;
  event.waitUntil(
    (async () => {
      try {
        switch (event.data?.type) {
          case "STATUS":
            break;
          case "DOWNLOAD":
            if (!download) {
              downloadAbort = new AbortController();
              download = fetchPack().finally(() => {
                download = null;
                downloadAbort = null;
              });
            }
            await download;
            break;
          case "CANCEL":
            downloadAbort?.abort();
            if (download) await download.catch(() => {});
            break;
          case "CLEAR":
            downloadAbort?.abort();
            if (download) await download.catch(() => {});
            for (const name of await caches.keys())
              if (name.startsWith(PREFIX)) await caches.delete(name);
            break;
          case "ACTIVATE":
            await self.skipWaiting();
            break;
          default:
            return;
        }
        const state = await status();
        port?.postMessage({ ok: true, ...state });
        await notify(state);
      } catch {
        const state = await status();
        port?.postMessage({ ok: false, ...state });
        await notify({ ...state, failed: true });
      }
    })(),
  );
});
