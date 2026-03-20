const CACHE_NAME = "deger-app-v5";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/styles/style.css",
  "./app/main.js",
  "./core/store.js",
  "./core/storage.js",
  "./core/progression.js",
  "./core/selectors.js",
  "./ui/render.js",
  "./data/program.js",
  "./assets/icons/sp.png",
  "./assets/icons/sp-arka.PNG",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== "image-cache").map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  if (request.destination === "image" || request.url.includes("/assets/images/") || request.url.includes("/assets/icons/")) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          const clone = response.clone();
          caches.open("image-cache").then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});