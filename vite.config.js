import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');

/* GitHub Pages serves this project from https://<user>.github.io/<REPO>/ .
   Every asset must resolve under that subpath, so `base` is not optional. */
const REPO = 'dragon-bey-hunt';

/* Optional assets (see brief §11) are detected at BUILD time, not by probing
   the network at runtime. A runtime HEAD request would fail in the garage with
   no wifi; resolving here means the filename is baked into the bundle and the
   file is precached by the service worker like any other asset. Drop a file
   into public/ and rebuild — nothing else to configure. */
function findOptional(stem) {
  try {
    const hit = fs
      .readdirSync(PUBLIC_DIR)
      .filter((f) => f.toLowerCase().startsWith(stem + '.'))
      .sort()[0];
    return hit || null;
  } catch {
    return null;
  }
}

function buildVersion() {
  const d = new Date();
  const stamp =
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, '0')}` +
    `${String(d.getDate()).padStart(2, '0')}.` +
    `${String(d.getHours()).padStart(2, '0')}` +
    `${String(d.getMinutes()).padStart(2, '0')}`;
  let sha = '';
  try {
    sha = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    /* not a git checkout yet — stamp alone is enough to tell builds apart */
  }
  return sha ? `${stamp}-${sha}` : stamp;
}

export default defineConfig({
  base: `/${REPO}/`,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Dragon Bey Hunt',
        short_name: 'Bey Hunt',
        description: "Evan's birthday dragon treasure hunt.",
        id: `/${REPO}/`,
        start_url: `/${REPO}/`,
        scope: `/${REPO}/`,
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        background_color: '#1a0b2e',
        theme_color: '#1a0b2e',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        /* Video/image slots must be precached too, or the garage finale dies. */
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,gif,woff,woff2,mp4,webm,m4v,mov,ogg}',
        ],
        /* Default is 2 MiB, which silently drops any generated dragon clip. */
        maximumFileSizeToCacheInBytes: 40 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: 'index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion()),
    __IGNIS_PORTRAIT__: JSON.stringify(findOptional('ignis-portrait')),
    __IGNIS_INTRO__: JSON.stringify(findOptional('ignis-intro')),
    __WYRM_PORTRAIT__: JSON.stringify(findOptional('wyrm-portrait')),
  },
  build: {
    target: 'es2018',
    assetsInlineLimit: 0,
  },
});
