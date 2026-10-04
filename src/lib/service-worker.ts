/**
 * Registers `public/sw.js` (offline page + static asset cache) in production builds.
 * In development the worker is removed instead, so cached chunks never fight with hot reload.
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (process.env.NODE_ENV !== 'production') {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())));
    return;
  }

  // updateViaCache 'none': the browser always checks for a new sw.js instead of using its HTTP cache.
  navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
    // Not fatal: the app works the same without it, only offline support and install are lost.
  });
}
