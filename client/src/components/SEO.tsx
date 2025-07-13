import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  locale?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app';
  noIndex?: boolean;
  canonical?: string;
}

export function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords = [],
  author,
  publishedTime,
  modifiedTime,
  locale,
  siteName = 'Кармічний Щоденник',
  twitterCard = 'summary_large_image',
  noIndex = false,
  canonical
}: SEOProps) {
  const { t, i18n } = useTranslation();

  // Default values
  const defaultTitle = t('seo.defaultTitle', 'Кармічний Щоденник - Ваш персональний помічник духовного росту');
  const defaultDescription = t('seo.defaultDescription', 'Розвивайте позитивну карму через щоденні практики, рефлексії та духовні принципи. Персональний ІІ-помічник для вашого внутрішнього зростання.');
  const defaultImage = `${window.location.origin}/icon-512.png`;
  const defaultUrl = window.location.href;
  const defaultLocale = i18n.language === 'uk' ? 'uk_UA' : 'en_US';

  // Default keywords
  const defaultKeywords = [
    'карма', 'щоденник', 'медитація', 'духовність', 'саморозвиток',
    'рефлексія', 'принципи', 'позитивна карма', 'внутрішній ріст',
    'усвідомленість', 'практики', 'духовний розвиток'
  ];

  // Final values
  const finalTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = image || defaultImage;
  const finalUrl = url || defaultUrl;
  const finalLocale = locale || defaultLocale;
  const finalKeywords = [...defaultKeywords, ...keywords];

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Helper function to update meta tags
    const updateMetaTag = (selector: string, content: string, attribute: string = 'content') => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else if (selector.includes('name=')) {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Basic meta tags
    updateMetaTag('meta[name="description"]', finalDescription);
    updateMetaTag('meta[name="keywords"]', finalKeywords.join(', '));
    updateMetaTag('meta[name="author"]', author || siteName);
    updateMetaTag('meta[name="robots"]', noIndex ? 'noindex, nofollow' : 'index, follow');
    updateMetaTag('meta[name="language"]', finalLocale);
    updateMetaTag('meta[name="viewport"]', 'width=device-width, initial-scale=1.0');
    updateMetaTag('meta[name="theme-color"]', '#8B5CF6');

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', finalTitle);
    updateMetaTag('meta[property="og:description"]', finalDescription);
    updateMetaTag('meta[property="og:image"]', finalImage);
    updateMetaTag('meta[property="og:url"]', finalUrl);
    updateMetaTag('meta[property="og:type"]', type);
    updateMetaTag('meta[property="og:site_name"]', siteName);
    updateMetaTag('meta[property="og:locale"]', finalLocale);

    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', twitterCard);
    updateMetaTag('meta[name="twitter:title"]', finalTitle);
    updateMetaTag('meta[name="twitter:description"]', finalDescription);
    updateMetaTag('meta[name="twitter:image"]', finalImage);
    updateMetaTag('meta[name="twitter:url"]', finalUrl);

    // Article specific tags
    if (type === 'article') {
      if (publishedTime) {
        updateMetaTag('meta[property="article:published_time"]', publishedTime);
      }
      if (modifiedTime) {
        updateMetaTag('meta[property="article:modified_time"]', modifiedTime);
      }
      if (author) {
        updateMetaTag('meta[property="article:author"]', author);
      }
    }

    // Canonical URL
    const canonicalUrl = canonical || finalUrl;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Alternate language links
    const alternateLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
    alternateLinks.forEach(link => link.remove());

    const supportedLocales = ['uk', 'en'];
    supportedLocales.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = `${window.location.origin}${window.location.pathname}?lang=${lang}`;
      document.head.appendChild(link);
    });

    // PWA related meta tags
    updateMetaTag('meta[name="application-name"]', siteName);
    updateMetaTag('meta[name="apple-mobile-web-app-title"]', siteName);
    updateMetaTag('meta[name="apple-mobile-web-app-capable"]', 'yes');
    updateMetaTag('meta[name="apple-mobile-web-app-status-bar-style"]', 'black-translucent');
    updateMetaTag('meta[name="mobile-web-app-capable"]', 'yes');

    // Structured data (JSON-LD)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": siteName,
      "description": finalDescription,
      "url": finalUrl,
      "image": finalImage,
      "applicationCategory": "LifestyleApplication",
      "operatingSystem": "Any",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "author": {
        "@type": "Organization",
        "name": siteName
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    };

    // Remove existing JSON-LD
    const existingJsonLd = document.querySelector('script[type="application/ld+json"]');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    // Add new JSON-LD
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Preload important resources
    const preloadLinks = [
      { href: '/icon-192.png', as: 'image', type: 'image/png' },
      { href: '/icon-512.png', as: 'image', type: 'image/png' },
      { href: '/manifest.json', as: 'manifest' }
    ];

    preloadLinks.forEach(({ href, as, type }) => {
      if (!document.querySelector(`link[rel="preload"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        if (type) link.type = type;
        document.head.appendChild(link);
      }
    });

  }, [finalTitle, finalDescription, finalImage, finalUrl, finalLocale, finalKeywords, type, author, publishedTime, modifiedTime, noIndex, canonical, siteName, twitterCard]);

  return null; // This component doesn't render anything
}

// Hook for easy SEO management
export function useSEO(props: SEOProps) {
  return <SEO {...props} />;
}

// Higher-order component for pages
export function withSEO<P extends object>(Component: React.ComponentType<P>, seoProps: SEOProps) {
  return function WrappedComponent(props: P) {
    return (
      <>
        <SEO {...seoProps} />
        <Component {...props} />
      </>
    );
  };
}

export default SEO; 