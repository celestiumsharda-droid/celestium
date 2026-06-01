import { defineConfig, type Plugin } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { imagetools } from "vite-imagetools";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Dev-only pretty-path routing.
 *
 * In production, scripts/build-discoveries.ts emits a real
 * /discoveries/<slug>/index.html for every article. The dev server
 * has no such files, so without this plugin Vite's SPA fallback
 * serves the homepage (index.html) for those URLs — which is why the
 * article links appeared to "go nowhere."
 *
 * This middleware rewrites any /discoveries/<slug>/ request to the
 * discovery.html template. The browser URL is unchanged, so the
 * client engine reads the slug from location.pathname and renders the
 * right article — identical behaviour to production.
 */
function devDiscoveryRouting(): Plugin {
  return {
    name: "celestium:dev-discovery-routing",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/discoveries\/[^/]+\/?(?:\?.*)?$/.test(req.url)) {
          req.url = "/discovery.html";
        }
        next();
      });
    },
  };
}

/**
 * Celestium build config.
 *
 * - `root: src/` keeps source HTML/TS/CSS together.
 * - `discovery.html` is a TEMPLATE — the post-build script
 *   (scripts/build-discoveries.ts) clones it into
 *   /discoveries/<slug>/index.html with per-article OG/Twitter/
 *   canonical tags baked in.
 * - vite-imagetools enables `?w=640;1280&format=avif;webp` query syntax
 *   on imported images, giving us responsive srcsets without a CMS.
 */
export default defineConfig({
  root: "src",
  publicDir: resolve(__dirname, "public"),
  plugins: [imagetools(), devDiscoveryRouting()],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        home: resolve(__dirname, "src/index.html"),
        discovery: resolve(__dirname, "src/discovery.html"),
        discoveriesIndex: resolve(__dirname, "src/discoveries/index.html"),
        notfound: resolve(__dirname, "src/404.html"),
      },
    },
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5173,
    open: "/index.html",
  },
  preview: {
    port: 4173,
  },
});
