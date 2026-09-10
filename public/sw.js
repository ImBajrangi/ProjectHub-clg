// CodeShastra ProjectHub - Service Worker for Device Push Notifications & Image Egress Caching
const CACHE_NAME = 'codeshastra-media-v1';

// Cache-First strategy for images to eliminate egress
self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/image') || url.pathname.startsWith('/images')) {
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

self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.subject || 'CodeShastra ProjectHub Notice';
    const options = {
      body: data.body || 'You have received an official project notification.',
      icon: '/image/arpit.png',
      badge: '/badge.png',
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

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url || '/');
    })
  );
});
