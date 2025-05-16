const cacheName = "aviameter-v0";
const appShellFiles = ["/"]

self.addEventListener("install", (e) => {
    console.log("[sw] install");
    e.waitUntil(
        (async()=> {
            const cache = await cache.open(cacheName);
            console.log("[sw] Caching all: app shell and content");
            await cache.addAll(appShellFiles)
        })
    )
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key === cacheName) {
            return;
          }
          return caches.delete(key);
        }),
      );
    }),
  );
});