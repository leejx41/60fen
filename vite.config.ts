import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const builtAt = new Date();
const pad = (value: number): string => String(value).padStart(2, "0");
const buildId = `${builtAt.getFullYear()}-${pad(builtAt.getMonth() + 1)}-${pad(
  builtAt.getDate(),
)} ${pad(builtAt.getHours())}:${pad(builtAt.getMinutes())}:${pad(
  builtAt.getSeconds(),
)}`;

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "app/dist",
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    globals: false,
    exclude: [
      "**/node_modules/**",
      "**/app/dist/**",
      "**/dist/**",
      "**/review/**",
    ],
  },
});
