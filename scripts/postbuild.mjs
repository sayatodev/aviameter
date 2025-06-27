import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* Config */
const BASE_FILES = [
    "/favicon.ico",
    "/aviameter-manifest.json",
    "/manifest.webmanifest",
];
const ROUTES = {
    mainApp: {
        path: "/",
        chunkGroups: ["/layout", "/(main)/layout", "/(main)/page"],
        components: ["app\\(main)\\page.tsx -> @/components/Map"],
        files: [
            "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
            "/airports.json",
            "/planet.geo.json",
        ],
    },
    airportMap: {
        path: "/airport",
        chunkGroups: ["/layout", "/(main)/layout", "/(main)/airport/page"],
        components: [
            "app\\(main)\\airport\\page.tsx -> @/components/AirportMap",
        ],
        files: [
            "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
            "/airports.json",
            "/vhhh.geo.json",
        ],
    },
    guide: {
        path: "/guide",
        chunkGroups: ["/layout", "/guide/page"],
        components: [],
        files: [],
    },
};

const APP_MANIFEST_PATH = "../.next/app-build-manifest.json";
const COMPONENT_MANIFEST_PATH = "../.next/react-loadable-manifest.json";
const SW_PATH = "../public/sw.js";
const OUTPUT_PATH = "../public/aviameter-manifest.json";

/* ====== */

console.log(`[Post-build] Generating chunk map...`);

// load both manifests
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appManifestPath = path.join(__dirname, APP_MANIFEST_PATH);
const componentManifestPath = path.join(__dirname, COMPONENT_MANIFEST_PATH);
const swPath = path.join(__dirname, SW_PATH);

const appManifest = JSON.parse(fs.readFileSync(appManifestPath, "utf-8"));
const componentManifest = JSON.parse(
    fs.readFileSync(componentManifestPath, "utf-8"),
);

const swContent = fs.readFileSync(swPath, "utf-8");
const cacheNameMatch = swContent.match(/const cacheName = "([^"]+)";/);
if (!cacheNameMatch) {
    throw new Error("Cache name not found in service worker file.");
}
const cacheName = cacheNameMatch[1];

// Map related chunk files
const chunkMap = {};
for (const routeName in ROUTES) {
    const route = ROUTES[routeName];
    const pageChunks = [];
    for (const group of route.chunkGroups) {
        const files = appManifest.pages[group].map((path) => `/_next/${path}`);
        pageChunks.push(...files);
    }

    const componentChunks = [];
    for (const component of route.components) {
        const files = componentManifest[component]?.files.map(
            (path) => `/_next/${path}`,
        );
        componentChunks.push(...files);
    }

    chunkMap[routeName] = [
        ...new Set([
            route.path,
            ...BASE_FILES,
            ...pageChunks,
            ...componentChunks,
            ...route.files,
        ]),
    ];
}

// Write the chunk map to a JSON file
const outputPath = path.join(__dirname, OUTPUT_PATH);
fs.writeFileSync(
    outputPath,
    JSON.stringify({
        cacheName,
        routes: chunkMap,
    }),
    "utf-8",
);

console.log(`[Post-build] Chunk map written to ${outputPath}`);
