const react = require("@vitejs/plugin-react");
const path = require("path");

/** @type {import('vite').UserConfig} */
module.exports = {
  root: "client",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src")
    }
  }
};
