import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET ?? "http://localhost:8080";
  const usePolling = env.CHOKIDAR_USEPOLLING === "true";
  const hmrClientPort = Number(env.VITE_HMR_CLIENT_PORT ?? 5173);
  const hmrHost = env.VITE_HMR_HOST;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      watch: usePolling
        ? {
            usePolling: true,
            interval: 1000,
          }
        : undefined,
      hmr: {
        clientPort: hmrClientPort,
        ...(hmrHost ? { host: hmrHost } : {}),
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
