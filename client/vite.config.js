import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

/** @type {import('vite').UserConfig} */
export default defineConfig({
  root: ".",
  base: "/",
  plugins: [react()],
  publicDir: "public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared")
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        // ИСПРАВЛЕНИЕ: Фиксированные имена для основных файлов в продакшене
        entryFileNames: 'assets/index.js',
        
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks: {
          // Core vendor chunk
          vendor: ['react', 'react-dom'],
          // UI libraries chunk
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          // Chart libraries chunk  
          charts: ['recharts'],
          // Router and state management
          routing: ['wouter', '@tanstack/react-query'],
          // Internationalization
          i18n: ['react-i18next', 'i18next'],
          // Auth and OAuth
          auth: ['@react-oauth/google'],
          // Date utilities
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'wouter', '@tanstack/react-query']
  }
});
