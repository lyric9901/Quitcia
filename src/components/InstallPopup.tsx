'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPopup() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if the user already dismissed it in this session to avoid annoying them
    const hasDismissed = sessionStorage.getItem('installPromptDismissed');
    if (!hasDismissed) {
      setShowPopup(true);
    }
  }, []);

  const handleInstall = () => {
    // URL to the base.apk file
    const apkUrl = 'https://pub-978950eef49c492085cdafeca0b26f00.r2.dev/base.apk';
    
    // Create an invisible anchor element to trigger the download
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'UrgeRelief.apk'; // Suggests a filename for the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Hide the popup after initiating the download
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
          This app isn’t on the Play Store yet. Download the APK by clicking on button below to get early access
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleInstall}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            Download APK
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