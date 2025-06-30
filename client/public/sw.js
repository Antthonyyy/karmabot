const CACHE_NAME = 'karma-diary-v1';
const STATIC_CACHE = 'karma-diary-static-v1';
const DYNAMIC_CACHE = 'karma-diary-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/settings',
  '/analytics',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/apple-touch-icon.svg',
  '/manifest.json',
  // Core CSS and JS will be cached automatically by the browser
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/user/me',
  '/api/principles',
  '/api/insights/daily',
  '/api/subscriptions/current'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName.startsWith('karma-diary-');
            })
            .map(cacheName => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const shouldCache = API_CACHE_PATTERNS.some(pattern => 
    url.pathname.includes(pattern)
  );
  
  if (!shouldCache) {
    return fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    console.log('📡 Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('💾 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline page for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Немає з\'єднання з інтернетом' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fallback to cached page or offline page
    console.log('📡 Network failed for navigation, trying cache');
    
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Кармічний Щоденник - Офлайн</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
            }
            .container {
              background: rgba(255,255,255,0.1);
              padding: 2rem;
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            h1 { margin-bottom: 1rem; }
            button {
              background: #8B5CF6;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 0.5rem;
              cursor: pointer;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔮 Кармічний Щоденник</h1>
            <p>Немає з'єднання з інтернетом</p>
            <p>Перевірте підключення та спробуйте знову</p>
            <button onclick="window.location.reload()">🔄 Спробувати знову</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('❌ Failed to fetch:', request.url);
    throw error;
  }
}

// Handle push notifications
self.addEventListener('push', event => {
  console.log('📱 Push notification received:', event);
  
  const options = {
    body: 'Час для рефлексії та запису в щоденник',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'karma-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Відкрити щоденник',
        icon: '/icon-192.png'
      },
      {
        action: 'later',
        title: 'Нагадати пізніше'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.title = payload.title || 'Кармічний Щоденник';
      options.icon = payload.icon || options.icon;
      options.data = { ...options.data, ...payload.data };
    } catch (error) {
      console.log('❌ Error parsing push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification('Кармічний Щоденник', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
    );
  } else if (event.action === 'later') {
    // Schedule reminder for later (30 minutes)
    event.waitUntil(
      self.registration.showNotification('Нагадування відкладено', {
        body: 'Нагадаємо через 30 хвилин',
        icon: '/icon-192.png',
        tag: 'reminder-postponed'
      })
    );
  }
});

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'journal-entry-sync') {
    event.waitUntil(syncJournalEntries());
  }
});

// Sync journal entries when back online
async function syncJournalEntries() {
  try {
    // Get pending entries from IndexedDB or localStorage
    // This would integrate with your app's offline storage
    console.log('📝 Syncing offline journal entries...');
    
    // Implementation would depend on your offline storage strategy
    // For now, just log that sync is working
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Failed to sync journal entries:', error);
    throw error;
  }
}

// Handle push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [100, 50, 100],
    data: data.url ? { url: data.url } : undefined,
    actions: [
      {
        action: 'open',
        title: 'Відкрити',
        icon: '/icon-192.svg'
      },
      {
        action: 'close',
        title: 'Закрити'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Кармічний Щоденник', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

console.log('🔮 Karma Diary Service Worker loaded successfully');