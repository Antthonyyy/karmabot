const react = require("@vitejs/plugin-react");
const path = require("path");

/** @type {import('vite').UserConfig} */
module.exports = {
  root: "client",
  plugins: [react()],
  resolve: {
    alias: {
      "@": "./src"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: []
    }
  }
};
