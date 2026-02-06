import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["quizorax-clg.onrender.com", "quizorax.codedevio.in"]
  },
  preview: {
    port: 4173,
    strictPort: false,
    host: "0.0.0.0"
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    chunkSizeWarningLimit: 1000
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
