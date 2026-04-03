// @/lib/offlineAudio.ts

const DB_NAME = 'QuitciaAudioDB';
const STORE_NAME = 'audio-store';

// The audio files we want to cache locally
const AUDIO_TRACKS = [
  "/audio/track1.mp3",
  "/audio/track2.mp3",
  "/audio/track3.mp3",
  "/audio/track4.mp3",
];

// Helper to open the local database
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Downloads and caches the audio files in the background
export const cacheAudioFiles = async () => {
  if (typeof window === "undefined" || !window.indexedDB) return;

  try {
    const db = await getDB();

    for (const url of AUDIO_TRACKS) {
      // Check if it's already saved locally
      const exists = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(url);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      });

      if (!exists) {
        try {
          console.log(`Downloading ${url} for offline storage...`);
          const response = await fetch(url);
          if (!response.ok) throw new Error("Network response failed");
          
          const blob = await response.blob();
          
          // Save the actual audio file to local IndexedDB
          await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(blob, url);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
          });
          console.log(`Successfully saved ${url} offline.`);
        } catch (error) {
          console.error(`Failed to cache ${url}:`, error);
        }
      }
    }
  } catch (err) {
    console.error("IndexedDB initialization failed:", err);
  }
};

// Retrieves the local offline URL for the audio player
export const getOfflineAudioUrl = async (url: string): Promise<string> => {
  if (typeof window === "undefined" || !window.indexedDB) return url;

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(url);
      
      request.onsuccess = () => {
        if (request.result) {
          // Creates a local URL directly from device storage (NO network needed!)
          resolve(URL.createObjectURL(request.result));
        } else {
          // If not downloaded yet, fallback to fetching from internet
          resolve(url);
        }
      };
      request.onerror = () => resolve(url);
    });
  } catch (e) {
    return url;
  }
};