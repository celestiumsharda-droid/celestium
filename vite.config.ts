import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { imagetools } from "vite-imagetools";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Celestium build config.
 *
 * - `root: src/` keeps source HTML/TS/CSS together.
 * - `discovery.html` is a TEMPLATE — the post-build script
 *   (scripts/build-discoveries.mjs) clones it into
 *   /discoveries/<slug>/index.html with per-article OG/Twitter/
 *   canonical tags baked in.
 * - vite-imagetools enables `?w=640;1280&format=avif;webp` query syntax
 *   on imported images, giving us responsive srcsets without a CMS.
 */
export default defineConfig({
  root: "src",
  publicDir: resolve(__dirname, "public"),
  plugins: [imagetools()],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        home: resolve(__dirname, "src/index.html"),
        discovery: resolve(__dirname, "src/discovery.html"),
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
