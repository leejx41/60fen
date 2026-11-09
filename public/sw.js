/* A deliberately small app-shell service worker: no build plugin, no push
   server. It caches the shell and same-origin assets, and it turns a due-plan
   reminder click into a message that wakes the open tab. */
const CACHE = "sixty-shell-v3";
const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

/**
 * Fetch one asset and put it in the cache. Individual failures are reported by
 * the caller, so one missing font or icon cannot discard the whole batch.
 */
async function cacheOne(cache, url) {
  const response = await fetch(url, { cache: "reload" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  await cache.put(url, response);
}

/**
 * Cache the fixed shell. The two entry documents are required; optional icons
 * and the manifest may fail without breaking a usable shell.
 */
async function precacheShell(cache) {
  const required = new Set(["/", "/index.html"]);
  const results = await Promise.allSettled(
    PRECACHE.map((url) => cacheOne(cache, url)),
  );
  const failed = PRECACHE.filter((_, index) => results[index].status === "rejected");

  if (failed.some((url) => required.has(url))) {
    throw new Error(`Required shell asset was not cached: ${failed.join(", ")}`);
  }
  if (failed.length) {
    console.warn("[sw] optional shell assets were not cached:", failed.join(", "));
  }
}

/**
 * The hashed JS/CSS names are not known until the build. Parse the built
 * index.html at install time instead of hardcoding them, then pull the CSS
 * font URLs so a cleared HTTP cache does not leave a shell without styles.
 */
async function precacheBuiltAssets(cache) {
  try {
    const response = await fetch("/index.html", { cache: "no-store" });
    if (!response.ok) return;

    const html = await response.clone().text();
    await cache.put("/index.html", response.clone());

    const assets = new Set(
      [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(
        (match) => match[1],
      ),
    );

    for (const asset of [...assets]) {
      if (!asset.endsWith(".css")) continue;
      try {
        const cssResponse = await fetch(asset, { cache: "no-store" });
        if (!cssResponse.ok) continue;
        const css = await cssResponse.clone().text();
        for (const match of css.matchAll(
          /url\((?:"|')?(\/assets\/[^)"']+)/g,
        )) {
          assets.add(match[1]);
        }
      } catch {
        // A missing font only degrades typography; it should not break install.
      }
    }

    const urls = [...assets];
    const results = await Promise.allSettled(
      urls.map((url) => cacheOne(cache, url)),
    );
    const failed = urls.filter((_, index) => results[index].status === "rejected");
    if (failed.length) {
      // A missing font or chunk should degrade one feature, not the whole shell.
      console.warn("[sw] built assets were not fully cached:", failed.join(", "));
    }
  } catch (error) {
    // The shell cache is still usable if the environment blocks this fetch.
    console.warn("[sw] could not precache built assets:", error);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await precacheShell(cache);
      await precacheBuiltAssets(cache);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put("/index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = new URL(data.url || "/#/today", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          // Do not force-navigate over an in-progress intercept/branch/night.
          // The scheduler catches the due plan up on the next plain screen.
          client.postMessage({
            type: "SIXTY_NOTIFICATION_CLICK",
            planId: data.planId || null,
          });
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
