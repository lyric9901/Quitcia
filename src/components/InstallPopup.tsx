'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type Mode = 'desktop' | 'mobile';

export default function InstallPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [mode, setMode] = useState<Mode>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.matchMedia?.('(display-mode: standalone)').matches) return;
    if (sessionStorage.getItem('installPromptDismissed')) return;

    const ua = navigator.userAgent || '';
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      window.matchMedia?.('(pointer: coarse)').matches;

    if (!isMobile) {
      setMode('desktop');
      setShowPopup(true);
      return;
    }

    setMode('mobile');

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPopup(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const handleInstall = async () => {
    if (mode === 'desktop') {
      const apkUrl = 'https://pub-978950eef49c492085cdafeca0b26f00.r2.dev/base.apk';
      const link = document.createElement('a');
      link.href = apkUrl;
      link.download = 'UrgeRelief.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowPopup(false);
      return;
    }

    if (!deferredPrompt) {
      setShowPopup(false);
      return;
    }

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // Ignore: user dismissed or browser blocked the prompt
    } finally {
      setDeferredPrompt(null);
      setShowPopup(false);
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPopup) return null;

  const body =
    mode === 'desktop'
      ? "This app isn’t on the Play Store yet. Download the APK by clicking on button below to get early access Note: if you see any popup inside the app, just ignore it and use the app as normal."
      : 'Install Urge Relief to your home screen for a distraction-free, fullscreen experience — no browser bar.';
  const ctaLabel = mode === 'desktop' ? 'Download APK' : 'Install App';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center overflow-hidden">

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Content */}
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
          <Smartphone className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Install Urge Relief
        </h3>

        <p className="text-sm text-gray-500 mb-6">
          {body}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleInstall}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            {ctaLabel}
          </button>

          <button
            onClick={handleDismiss}
            className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 py-2"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
