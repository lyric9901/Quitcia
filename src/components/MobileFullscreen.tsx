'use client';

import { useEffect } from 'react';

export default function MobileFullscreen() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    if (!isAndroid) return;

    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!req) return;

    const trigger = () => {
      try {
        const result = req.call(root) as unknown;
        if (result && typeof (result as Promise<void>).catch === 'function') {
          (result as Promise<void>).catch(() => {});
        }
      } catch {
        // Blocked by host (in-app browser, Custom Tab). Silently ignore.
      }
    };

    document.addEventListener('touchstart', trigger, { once: true, passive: true });
    document.addEventListener('click', trigger, { once: true });

    return () => {
      document.removeEventListener('touchstart', trigger);
      document.removeEventListener('click', trigger);
    };
  }, []);

  return null;
}
