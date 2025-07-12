import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type { ViteDevServer } from 'vite';

export async function setupVite(app: express.Application) {
  try {
    // Create Vite server in middleware mode
    const vite: ViteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: './client',
    });

    // Use vite's connect instance as middleware
    app.use(vite.ssrFixStacktrace);
    app.use('/src', vite.middlewares);
    app.use('/node_modules', vite.middlewares);
    app.use('/@vite', vite.middlewares);
    app.use('/@fs', vite.middlewares);
    
    console.log('✅ Vite middleware configured');
    
    return vite;
  } catch (error) {
    console.error('❌ Failed to setup Vite middleware:', error);
    return null;
  }
}

export function serveStatic(app: express.Application) {
  const root = './dist/public';
  app.use(express.static(root));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(root, 'index.html'));
  });
}
