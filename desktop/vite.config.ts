import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@camhealth/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  server: { port: 5173 },
});
