const cacheName = "aviameter-v1";

self.addEventListener("install", () => {
    console.log("service worker installed");
});

self.addEventListener("activate", () => {
    console.log("service worker activated");
});

const cacheClone = async (e) => {
    const res = await fetch(e.request);
    const resClone = res.clone();

    const cache = await caches.open(cacheName);
    await cache.put(e.request, resClone);
    return res;
};

self.addEventListener("fetch", (e) => {
    e.respondWith(
        cacheClone(e)
            .catch(() => caches.match(e.request))
            .then((res) => res)
    );
});
