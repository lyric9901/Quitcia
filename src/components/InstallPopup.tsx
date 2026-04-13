'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

// Define the standard PWA event interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if the user already dismissed it in this session to avoid annoying them
      const hasDismissed = sessionStorage.getItem('installPromptDismissed');
      if (!hasDismissed) {
        setShowPopup(true);
      }
    };

    const handleAppInstalled = () => {
      // Clear the prompt and hide popup when successfully installed
      setDeferredPrompt(null);
      setShowPopup(false);
      console.log('PWA installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the actual browser install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // We can no longer use the prompt, so clear it
    setDeferredPrompt(null);
    setShowPopup(false);
  };

  const handleDismiss = () => {
    setShowPopup(false);
    // Save to session storage so it doesn't pop up again until they close and reopen the browser
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Do not render anything if the popup shouldn't be shown
  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 text-center overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Content */}
        <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
          <Smartphone className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Install Urge Relief
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Add this app to your home screen for faster access, offline capabilities, and a full-screen experience.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleInstall}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            Install App
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-2"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}