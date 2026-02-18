/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';

clientsClaim();
self.skipWaiting();

// Injected at build time by Workbox so built assets are precached
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// Runtime caching for JS/CSS/workers from same origin
registerRoute(
  ({ request }) => ['script', 'style', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'respira-static-v1' })
);

// Cache-first navigation for offline shell fallback
const navigationHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navigationHandler, {
  allowlist: [/.*/],
});
registerRoute(navigationRoute);

// Network-first for API GET calls to keep data fresh but allow offline fallback
registerRoute(
  ({ url, request }) => url.origin === self.location.origin && url.pathname.startsWith('/api/') && request.method === 'GET',
  new NetworkFirst({ cacheName: 'respira-api-v1', networkTimeoutSeconds: 5 })
);
