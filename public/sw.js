const cacheName = "aviameter-v1.1-dev20250604";

self.addEventListener("install", () => {
    console.log("service worker installed");
});

self.addEventListener("activate", () => {
    console.log("service worker activated");
});

const cacheClone = async (e) => {
    try {
        const res = await fetch(e.request);
        const resClone = res.clone();

        const cache = await caches.open(cacheName);
        await cache.put(e.request, resClone);
        return res;
    } catch (error) {
        console.error(`[sw] Failed to fetch`, e, error);
        throw error;
    }
};

self.addEventListener("fetch", (e) => {
    try {
        e.respondWith(
            cacheClone(e)
                .catch(() => caches.match(e.request))
                .then((res) => res),
        );
    } catch (error) {
        console.error(`[sw] Failed to create cache clone`, e, error);
    }
});
