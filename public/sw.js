// CodeShastra ProjectHub - Service Worker for Device Push Notifications & Image Egress Caching
const CACHE_NAME = 'codeshastra-media-v2';

// 1. Cache-First strategy for images and SVGs
self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/image') || url.pathname.startsWith('/images') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.webp')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(event.request).then(function (cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then(function (networkResponse) {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  }
});

// 2. Client-delegated background notifications
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SHOW_SYSTEM_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || 'CodeShastra Hub Alert', {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      ...options,
    });
  }
});

// 3. Web Push API listener
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.subject || 'CodeShastra ProjectHub Notice';
    const options = {
      body: data.body || 'You have received an official project notification.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.category || 'projecthub-notification',
      data: {
        url: data.url || '/dashboard/leader',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error handling push notification', err);
  }
});

// 4. Click action on system OS Notification Banner
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && client.url !== targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
