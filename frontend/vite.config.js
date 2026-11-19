import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Makes the app installable on phone and laptop (Progressive Web App)
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg", "apple-touch-icon.png"],
      manifest: {
        name: "College Library",
        short_name: "Library",
        description: "Search and reserve books from your college library.",
        theme_color: "#0f1118",
        background_color: "#0b0c12",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Save the app files (and the icon font) so the app opens even offline
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "/index.html",
        // Opening an API link (like a PDF) must reach the backend, not the app
        navigateFallbackDenylist: [/^\/api\//],
        // Save API answers so already-seen screens still work offline
        runtimeCaching: [
          {
            // Book cover pictures: keep them so they load fast and work offline
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "cover-images",
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true, // lets your phone open the app on the same Wi-Fi
  },
  preview: {
    port: 4173,
    host: true,
  },
});
