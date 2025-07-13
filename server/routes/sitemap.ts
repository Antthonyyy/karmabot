import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Generate sitemap.xml
router.get('/sitemap.xml', (req: Request, res: Response) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://karma-traker.onrender.com'
    : `http://localhost:${process.env.PORT || 5000}`;

  const staticPages = [
    {
      url: '/',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '1.0'
    },
    {
      url: '/dashboard',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      url: '/analytics',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/achievements',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      url: '/settings',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: '0.6'
    },
    {
      url: '/subscriptions',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: '0.5'
    }
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.send(sitemap);
});

// Generate robots.txt
router.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://karma-traker.onrender.com'
    : `http://localhost:${process.env.PORT || 5000}`;

  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for major search engines
Crawl-delay: 1`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.send(robots);
});

// Generate manifest.json with proper caching
router.get('/manifest.json', (req: Request, res: Response) => {
  const manifest = {
    name: "Кармічний Щоденник",
    short_name: "Карма",
    description: "Ваш персональний помічник у розвитку позитивної карми через щоденні практики та рефлексії",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#8B5CF6",
    background_color: "#FFFFFF",
    lang: "uk",
    scope: "/",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable"
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    categories: ["lifestyle", "productivity", "health"],
    shortcuts: [
      {
        name: "Новий запис",
        short_name: "Запис",
        description: "Створити новий запис у щоденнику",
        url: "/dashboard?action=new-entry",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml"
          }
        ]
      }
    ]
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.json(manifest);
});

export default router; 