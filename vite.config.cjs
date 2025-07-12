const react = require("@vitejs/plugin-react");
const path = require("path");

/** @type {import('vite').UserConfig} */
module.exports = {
  root: "client",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          // UI library - only existing modules
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-switch',
            '@radix-ui/react-progress',
            '@radix-ui/react-avatar'
          ],
          // Data fetching
          'tanstack': ['@tanstack/react-query'],
          // Router
          'wouter': ['wouter'],
          // Charts and data viz
          'charts': ['recharts'],
          // Icons
          'icons': ['lucide-react'],
          // i18n
          'i18n': ['react-i18next', 'i18next'],
          // Animation
          'animation': ['framer-motion'],
          // Utils
          'utils': ['date-fns', 'zod']
        }
      }
    }
  }
};
