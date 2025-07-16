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

// Security.txt endpoint для responsible disclosure (RFC 9116)
const securityTxtContent = `# Security Policy for Karma Tracker

Contact: mailto:security@karma-tracker.app
Contact: https://github.com/karma-tracker/karmabot/security/advisories
Expires: 2025-12-31T23:59:59.000Z
Preferred-Languages: uk, en, ru
Canonical: https://karma-tracker.app/.well-known/security.txt

# Responsible Disclosure Policy

We take security vulnerabilities seriously. If you discover a security issue, 
please report it responsibly by following these guidelines:

1. Do NOT publicly disclose the vulnerability until we have had a chance to address it
2. Provide detailed information about the vulnerability
3. Include steps to reproduce the issue
4. Allow reasonable time for us to respond and fix the issue

# Scope

In scope:
- Authentication and authorization bypasses
- SQL injection and other injection attacks  
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)
- Remote code execution
- Data exposure and privacy violations

Out of scope:
- Denial of service attacks
- Physical attacks
- Social engineering
- Issues requiring physical access

# Bug Bounty

Currently we do not offer monetary rewards, but we will:
- Acknowledge your contribution in our security acknowledgments
- Provide updates on the fix timeline
- Credit you in our release notes (if desired)

# Response Timeline

- Initial response: Within 48 hours
- Status update: Within 7 days
- Resolution target: Within 30 days (depending on severity)

Thank you for helping us keep Karma Tracker secure!`;

router.get('/security.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(securityTxtContent);
});

router.get('/.well-known/security.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(securityTxtContent);
});

export default router; 