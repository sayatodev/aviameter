import useSWR, { type Fetcher } from "swr";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { useState, useEffect } from "react";

const manifestFetcher: Fetcher<AviameterManifest, string> = (...args) =>
    fetch(...args).then((res) => res.json());

async function downloadAllFiles(manifest?: AviameterManifest) {
    if (!manifest) return;

    const cache = await caches.open(manifest.cacheName);
    const files = manifest.routes.mainApp.concat(
        manifest.routes.airportMap,
        manifest.routes.guide,
    );

    const promises = files.map((file) => {
        return fetch(file).then((response) => {
            if (response.ok) {
                return cache.put(file, response);
            } else {
                console.error(
                    `Failed to fetch ${file}: ${response.statusText}`,
                );
            }
        });
    });

    await Promise.all(promises);
    console.log("All files downloaded and cached.");
}

async function checkCache(cacheName: string, files: string[]) {
    const cache = await caches.open(cacheName);
    const cacheKeys = await cache.keys();
    const cachedUrls = cacheKeys.map((request) => request.url);
    const cachedPaths = cachedUrls.map((url) => new URL(url).pathname);
    console.log(
        files.map((file) => [
            file,
            cachedUrls.includes(file) || cachedPaths.includes(file),
        ]),
    );
    return files.every(
        (file) => cachedUrls.includes(file) || cachedPaths.includes(file),
    );
}

export function CacheModal() {
    const { data: manifest } = useSWR(
        "/aviameter-manifest.json",
        manifestFetcher,
    );

    const [cacheStatus, setCacheStatus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const routeNames = manifest
            ? (Object.keys(manifest.routes) as Array<
                  keyof AviameterManifest["routes"]
              >)
            : [];

        if (manifest) {
            routeNames.forEach((routeName) => {
                const files = manifest.routes[routeName];
                checkCache(manifest.cacheName, files).then((isCached) => {
                    setCacheStatus((prevStatus) => ({
                        ...prevStatus,
                        [routeName]: isCached,
                    }));
                });
            });
        }
    }, [manifest]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Manage Cache</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] z-1015">
                <p>Cache version: {manifest?.cacheName}</p>
                {manifest ? (
                    Object.keys(manifest.routes).map((routeName) => (
                        <div key={routeName} className="flex">
                            <p>{routeName}:</p>
                            <p>
                                {cacheStatus[routeName]
                                    ? "Ready"
                                    : "Not Cached"}
                            </p>
                        </div>
                    ))
                ) : (
                    <></>
                )}
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => downloadAllFiles(manifest)}
                >
                    Download All Files
                </Button>
            </DialogContent>
        </Dialog>
    );
}
