import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export const ADMOB_APP_ID = 'ca-app-pub-9866125308594860~7157300209';
export const ADMOB_REWARDED_INTERSTITIAL_UNIT_ID = 'ca-app-pub-9866125308594860/2331156969';
export const GOOGLE_TEST_REWARDED_INTERSTITIAL_UNIT_ID = 'ca-app-pub-3940256099942544/5354046379';

// Expo Go does not bundle custom native modules (react-native-google-mobile-ads).
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isAdMobNativeSupported = !isExpoGo && Platform.OS !== 'web';

let mobileAdsInstance: any = null;
let RewardedInterstitialAdClass: any = null;
let RewardedAdEventTypeEnum: any = null;
let AdEventTypeEnum: any = null;
let TestIdsObj: any = null;
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

function loadAdMobNativeModules() {
  if (!isAdMobNativeSupported) return false;

  if (!RewardedInterstitialAdClass) {
    try {
      const gma = require('react-native-google-mobile-ads');
      mobileAdsInstance = gma.default || gma.MobileAds;
      RewardedInterstitialAdClass = gma.RewardedInterstitialAd;
      RewardedAdEventTypeEnum = gma.RewardedAdEventType;
      AdEventTypeEnum = gma.AdEventType;
      TestIdsObj = gma.TestIds;
      return true;
    } catch (e) {
      console.warn('[AdMob] Native module react-native-google-mobile-ads not available:', e);
      return false;
    }
  }
  return true;
}

/**
 * Initializes the Google Mobile Ads SDK using the Quitcia App ID.
 * Safe to call multiple times (returns singleton promise).
 */
export async function initializeAdMob(): Promise<boolean> {
  if (!isAdMobNativeSupported) {
    console.log('[AdMob] Native ads not supported in this environment (Expo Go or Web)');
    return false;
  }

  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const loaded = loadAdMobNativeModules();
      if (!loaded || !mobileAdsInstance) {
        return false;
      }

      console.log(`[AdMob] Initializing Google Mobile Ads SDK (App ID: ${ADMOB_APP_ID})...`);
      const statuses = await mobileAdsInstance().initialize();
      console.log('[AdMob] Google Mobile Ads SDK initialized successfully:', statuses);
      isInitialized = true;
      return true;
    } catch (err) {
      console.warn('[AdMob] Failed to initialize Google Mobile Ads SDK:', err);
      return false;
    }
  })();

  return initPromise;
}

export interface UseRewardedInterstitialResult {
  isLoaded: boolean;
  isLoading: boolean;
  isNativeAvailable: boolean;
  showAd: (onEarnReward: () => void, onFallback?: () => void) => void;
  reloadAd: () => void;
}

/**
 * Hook for Rewarded Interstitial Ad placement (Gem reward).
 * Implements the official Google Mobile Ads Rewarded Interstitial lifecycle.
 */
export function useRewardedInterstitial(): UseRewardedInterstitialResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const adInstanceRef = useRef<any>(null);
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const onRewardCallbackRef = useRef<(() => void) | null>(null);
  const isUsingFallbackUnitRef = useRef(false);

  // Clear existing listeners
  const cleanupListeners = useCallback(() => {
    unsubscribersRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (_) {}
    });
    unsubscribersRef.current = [];
  }, []);

  const createAndLoadAd = useCallback((adUnitId: string) => {
    if (!isAdMobNativeSupported) {
      setIsLoaded(false);
      setIsLoading(false);
      return;
    }

    const hasModules = loadAdMobNativeModules();
    if (!hasModules || !RewardedInterstitialAdClass) {
      setIsLoaded(false);
      setIsLoading(false);
      return;
    }

    cleanupListeners();
    setIsLoading(true);
    setIsLoaded(false);

    try {
      console.log(`[AdMob] Creating Rewarded Interstitial ad with unit ID: ${adUnitId}`);
      const ad = RewardedInterstitialAdClass.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['health', 'wellness', 'habits', 'streak', 'focus'],
      });

      adInstanceRef.current = ad;

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventTypeEnum.LOADED, () => {
        console.log(`[AdMob] Rewarded Interstitial ad LOADED successfully (Unit: ${adUnitId})`);
        setIsLoaded(true);
        setIsLoading(false);
      });

      const unsubEarned = ad.addAdEventListener(
        RewardedAdEventTypeEnum.EARNED_REWARD,
        (reward: any) => {
          console.log('[AdMob] Rewarded Interstitial EARNED_REWARD triggered:', reward);
          if (onRewardCallbackRef.current) {
            onRewardCallbackRef.current();
            onRewardCallbackRef.current = null;
          }
        }
      );

      const unsubClosed = ad.addAdEventListener(AdEventTypeEnum.CLOSED, () => {
        console.log('[AdMob] Rewarded Interstitial ad CLOSED by user');
        setIsLoaded(false);
        setIsLoading(false);
        // Pre-load next ad for the next view
        createAndLoadAd(
          isUsingFallbackUnitRef.current
            ? (TestIdsObj?.REWARDED_INTERSTITIAL || GOOGLE_TEST_REWARDED_INTERSTITIAL_UNIT_ID)
            : ADMOB_REWARDED_INTERSTITIAL_UNIT_ID
        );
      });

      const unsubError = ad.addAdEventListener(AdEventTypeEnum.ERROR, (error: any) => {
        console.warn(`[AdMob] Rewarded Interstitial ERROR for ${adUnitId}:`, error);
        setIsLoaded(false);
        setIsLoading(false);

        // If the production unit failed (e.g. newly created ad unit, no fill yet / unverified account)
        // and we haven't tried the Google test unit yet, fallback to Google's official test ad unit
        if (!isUsingFallbackUnitRef.current && adUnitId === ADMOB_REWARDED_INTERSTITIAL_UNIT_ID) {
          console.log('[AdMob] Production ad unit did not fill. Falling back to Google test ad unit for testing...');
          isUsingFallbackUnitRef.current = true;
          const testUnit = TestIdsObj?.REWARDED_INTERSTITIAL || GOOGLE_TEST_REWARDED_INTERSTITIAL_UNIT_ID;
          createAndLoadAd(testUnit);
        }
      });

      unsubscribersRef.current = [unsubLoaded, unsubEarned, unsubClosed, unsubError];

      ad.load();
    } catch (err) {
      console.warn('[AdMob] Failed to create or load Rewarded Interstitial ad:', err);
      setIsLoading(false);
      setIsLoaded(false);
    }
  }, [cleanupListeners]);

  const loadAd = useCallback(async () => {
    if (!isAdMobNativeSupported) return;

    // Ensure SDK initialization completes before attempting to load ads
    await initializeAdMob();

    isUsingFallbackUnitRef.current = false;
    createAndLoadAd(ADMOB_REWARDED_INTERSTITIAL_UNIT_ID);
  }, [createAndLoadAd]);

  useEffect(() => {
    loadAd();
    return () => {
      cleanupListeners();
    };
  }, [loadAd, cleanupListeners]);

  const showAd = useCallback(
    (onEarnReward: () => void, onFallback?: () => void) => {
      onRewardCallbackRef.current = onEarnReward;

      if (isAdMobNativeSupported && adInstanceRef.current && isLoaded) {
        try {
          console.log('[AdMob] Presenting Rewarded Interstitial ad...');
          adInstanceRef.current.show();
          return;
        } catch (showError) {
          console.warn('[AdMob] Exception during ad.show():', showError);
        }
      }

      console.log('[AdMob] Native ad not ready or unavailable. Invoking fallback...');
      if (onFallback) {
        onFallback();
      } else {
        // If no fallback UI handler provided, grant reward
        onEarnReward();
      }
    },
    [isLoaded]
  );

  return {
    isLoaded,
    isLoading,
    isNativeAvailable: isAdMobNativeSupported,
    showAd,
    reloadAd: loadAd,
  };
}
