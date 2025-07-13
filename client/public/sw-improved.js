const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `karma-diary-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `karma-diary-dynamic-${CACHE_VERSION}`;
const API_CACHE = `karma-diary-api-${CACHE_VERSION}`;

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/settings',
  '/analytics',
  '/onboarding',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/apple-touch-icon.svg',
  '/manifest.json'
];

// API endpoints to cache with different strategies
const API_CACHE_STRATEGIES = {
  CACHE_FIRST: [
    '/api/user/me',
    '/api/principles',
    '/api/subscriptions/current'
  ],
  NETWORK_FIRST: [
    '/api/insights/daily',
    '/api/stats',
    '/api/achievements'
  ],
  CACHE_ONLY: [
    '/api/user/preferences'
  ]
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('🔧 SW v2: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 SW v2: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE).then(cache => {
        console.log('📦 SW v2: Initializing API cache');
        return Promise.resolve();
      })
    ])
    .then(() => {
      console.log('✅ SW v2: Installation complete');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('❌ SW v2: Installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 SW v2: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('karma-diary-') && 
                     !cacheName.includes(CACHE_VERSION);
            })
            .map(cacheName => {
              console.log('🗑️ SW v2: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ SW v2: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement advanced caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== self.location.origin) {
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

// Advanced API request handler with multiple strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Determine cache strategy
  let strategy = 'NETWORK_ONLY';
  
  for (const [strategyName, endpoints] of Object.entries(API_CACHE_STRATEGIES)) {
    if (endpoints.some(endpoint => pathname.includes(endpoint))) {
      strategy = strategyName;
      break;
    }
  }
  
  console.log(`📡 SW v2: ${strategy} strategy for ${pathname}`);
  
  switch (strategy) {
    case 'CACHE_FIRST':
      return handleCacheFirst(request);
    case 'NETWORK_FIRST':
      return handleNetworkFirst(request);
    case 'CACHE_ONLY':
      return handleCacheOnly(request);
    default:
      return handleNetworkOnly(request);
  }
}

// Cache-first strategy
async function handleCacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('💾 SW v2: Serving from cache (cache-first):', request.url);
    
    // Update cache in background
    updateCacheInBackground(request);
    
    return cachedResponse;
  }
  
  return handleNetworkFirst(request);
}

// Network-first strategy
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('💾 SW v2: Cached response (network-first):', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📡 SW v2: Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return createOfflineResponse(request);
  }
}

// Cache-only strategy
async function handleCacheOnly(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return createOfflineResponse(request);
}

// Network-only strategy
async function handleNetworkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return createOfflineResponse(request);
  }
}

// Update cache in background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse);
      console.log('🔄 SW v2: Background cache update:', request.url);
    }
  } catch (error) {
    console.log('🔄 SW v2: Background update failed:', request.url);
  }
}

// Create offline response
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Немає з\'єднання з інтернетом',
        offline: true
      }),
      {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  return new Response('Offline', { status: 503 });
}

// Enhanced navigation handler
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📡 SW v2: Navigation network failed, trying cache');
    
    // Try to serve cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to cached root
    const rootResponse = await caches.match('/');
    if (rootResponse) {
      return rootResponse;
    }
    
    // Ultimate fallback - offline page
    return createOfflinePage();
  }
}

// Create offline page
function createOfflinePage() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Кармічний Щоденник - Офлайн</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            max-width: 400px;
            margin: 1rem;
          }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { margin: 0 0 1rem 0; font-size: 1.5rem; }
          p { margin: 0.5rem 0; opacity: 0.9; }
          .buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          button {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
          }
          button:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
          }
          .status {
            margin-top: 1rem;
            padding: 0.5rem;
            border-radius: 0.5rem;
            background: rgba(255,255,255,0.1);
            font-size: 0.9rem;
          }
          .online { background: rgba(34,197,94,0.3); }
          .offline { background: rgba(239,68,68,0.3); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔮</div>
          <h1>Кармічний Щоденник</h1>
          <p>Немає з'єднання з інтернетом</p>
          <p>Перевірте підключення та спробуйте знову</p>
          
          <div class="buttons">
            <button onclick="window.location.reload()">🔄 Оновити</button>
            <button onclick="goHome()">🏠 На головну</button>
          </div>
          
          <div id="status" class="status offline">
            🔴 Офлайн
          </div>
        </div>
        
        <script>
          function goHome() {
            window.location.href = '/';
          }
          
          // Monitor online status
          function updateStatus() {
            const statusEl = document.getElementById('status');
            if (navigator.onLine) {
              statusEl.className = 'status online';
              statusEl.innerHTML = '🟢 Онлайн';
            } else {
              statusEl.className = 'status offline';
              statusEl.innerHTML = '🔴 Офлайн';
            }
          }
          
          window.addEventListener('online', updateStatus);
          window.addEventListener('offline', updateStatus);
          updateStatus();
          
          // Auto-reload when back online
          window.addEventListener('online', () => {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          });
        </script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Enhanced static asset handler
async function handleStaticRequest(request) {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('❌ SW v2: Static asset failed:', request.url);
    
    // For images, return a placeholder
    if (request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14" fill="#9ca3af">Зображення недоступне</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Enhanced push notification handler
self.addEventListener('push', event => {
  console.log('📱 SW v2: Push received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Кармічний Щоденник', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || 'Час для рефлексії та запису в щоденник',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: data.tag || 'karma-reminder',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard',
      timestamp: Date.now(),
      ...data.data
    },
    actions: [
      {
        action: 'open',
        title: 'Відкрити щоденник',
        icon: '/icon-192.svg'
      },
      {
        action: 'later',
        title: 'Нагадати пізніше'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Кармічний Щоденник',
      options
    )
  );
});

// Enhanced notification click handler
self.addEventListener('notificationclick', event => {
  console.log('🔔 SW v2: Notification clicked');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/dashboard';
  
  if (event.action === 'later') {
    // Schedule reminder for later
    event.waitUntil(
      scheduleReminder(30 * 60 * 1000) // 30 minutes
    );
    return;
  }
  
  // Open or focus app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Schedule reminder function
async function scheduleReminder(delay) {
  setTimeout(() => {
    self.registration.showNotification('Нагадування', {
      body: 'Час повернутися до щоденника',
      icon: '/icon-192.svg',
      tag: 'delayed-reminder'
    });
  }, delay);
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 SW v2: Background sync:', event.tag);
  
  if (event.tag === 'sync-journal-entries') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data
async function syncOfflineData() {
  try {
    console.log('📝 SW v2: Syncing offline data...');
    
    // Get offline data from IndexedDB
    const offlineData = await getOfflineData();
    
    if (offlineData.length > 0) {
      // Sync each entry
      for (const entry of offlineData) {
        await syncEntry(entry);
      }
      
      // Clear offline data after successful sync
      await clearOfflineData();
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('❌ SW v2: Sync failed:', error);
    throw error;
  }
}

// Placeholder functions for offline data management
async function getOfflineData() {
  // This would integrate with IndexedDB
  return [];
}

async function syncEntry(entry) {
  // This would sync individual entries
  return Promise.resolve();
}

async function clearOfflineData() {
  // This would clear synced data
  return Promise.resolve();
}

console.log('🔮 SW v2: Karma Diary Service Worker loaded successfully'); 