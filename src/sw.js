import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { drainQueue } from './sync/engine.js';
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//] }));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('sync', event => {
  if (event.tag === 'agripulse-sync') event.waitUntil(drainQueue().finally(async () => {
    const clients = await self.clients.matchAll();
    for (const client of clients) client.postMessage({ type: 'AGRIPULSE_SYNC_CHANGED' });
  }));
});
