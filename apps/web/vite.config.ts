import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const proxyTargets = {
  bff: "http://127.0.0.1:8787",
  mock: "http://127.0.0.1:8790",
  spring: "http://127.0.0.1:8080",
} as const;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiMode = env.VITE_API_MODE === "mock" || env.VITE_API_MODE === "spring" ? env.VITE_API_MODE : "bff";
  const apiTarget = env.VITE_API_PROXY_TARGET ?? proxyTargets[apiMode];

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    preview: {
      port: 3000,
    },
    build: {
      outDir: "dist",
      sourcemap: mode !== "production",
    },
  };
});
