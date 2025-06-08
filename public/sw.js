const cacheName = "aviameter-v1.3";

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
                .catch(() =>
                    caches.open(cacheName).then((cache) => {
                        return cache.match(e.request);
                    }),
                )
                .then((res) => res),
        );
    } catch (error) {
        console.error(`[sw] Failed to create cache clone`, e, error);
    }
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches
            .keys()
            .then(function (cacheNames) {
                return Promise.all(
                    cacheNames.map(function (cacheName) {
                        return caches.delete(cacheName);
                    }),
                );
            })
            .then(() => {
                // refresh the page after activation
                return self.clients.matchAll().then((clients) => {
                    clients.forEach((client) => {
                        client.navigate(client.url);
                    });
                });
            }),
    );
});
