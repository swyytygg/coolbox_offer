import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname), // 프로젝트 루트 기준
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      input: {
        ui: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
