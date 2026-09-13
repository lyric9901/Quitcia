import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export const ADMOB_APP_ID = 'ca-app-pub-9866125308594860~7157300209';
export const ADMOB_REWARDED_INTERSTITIAL_UNIT_ID = 'ca-app-pub-9866125308594860/2331156969';

// Expo Go does not bundle custom native modules (react-native-google-mobile-ads).
// Attempting to load native module in Expo Go causes immediate crash.
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let GoogleMobileAds: any = null;
let RewardedInterstitialAd: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;
let TestIds: any = null;

if (!isExpoGo && Platform.OS !== 'web') {
  try {
    const gma = require('react-native-google-mobile-ads');
    GoogleMobileAds = gma.default || gma;
    RewardedInterstitialAd = gma.RewardedInterstitialAd;
    RewardedAdEventType = gma.RewardedAdEventType;
    AdEventType = gma.AdEventType;
    TestIds = gma.TestIds;

    // Initialize SDK
    if (GoogleMobileAds && typeof GoogleMobileAds().initialize === 'function') {
      GoogleMobileAds().initialize().catch(() => {});
    }
  } catch (e) {
    GoogleMobileAds = null;
  }
}

export function useRewardedInterstitial() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const adRef = useRef<any>(null);
  const rewardCallbackRef = useRef<(() => void) | null>(null);

  const adUnitId = __DEV__ && TestIds?.REWARDED_INTERSTITIAL
    ? TestIds.REWARDED_INTERSTITIAL
    : ADMOB_REWARDED_INTERSTITIAL_UNIT_ID;

  const loadAd = useCallback(() => {
    if (!RewardedInterstitialAd || Platform.OS === 'web') {
      // In dev or web, mark as ready for simulation
      setLoaded(true);
      return;
    }

    try {
      setLoading(true);
      const ad = RewardedInterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setLoaded(true);
        setLoading(false);
      });

      const unsubEarned = ad.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          if (rewardCallbackRef.current) {
            rewardCallbackRef.current();
            rewardCallbackRef.current = null;
          }
        }
      );

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        setLoaded(false);
        // Pre-load next ad
        loadAd();
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
        setLoaded(false);
        setLoading(false);
      });

      ad.load();
      adRef.current = { ad, unsubLoaded, unsubEarned, unsubClosed, unsubError };
    } catch (e) {
      setLoading(false);
      setLoaded(true);
    }
  }, [adUnitId]);

  useEffect(() => {
    loadAd();
    return () => {
      if (adRef.current) {
        adRef.current.unsubLoaded?.();
        adRef.current.unsubEarned?.();
        adRef.current.unsubClosed?.();
        adRef.current.unsubError?.();
      }
    };
  }, [loadAd]);

  const showAd = useCallback(
    (onEarnReward: () => void) => {
      rewardCallbackRef.current = onEarnReward;

      if (adRef.current?.ad && loaded) {
        try {
          adRef.current.ad.show();
          return;
        } catch (e) {
          console.warn('Error showing ad, falling back to simulated grant', e);
        }
      }

      // Fallback if modal is not used directly
      onEarnReward();
    },
    [loaded]
  );

  return {
    loaded,
    loading,
    isNativeAvailable: !isExpoGo && Boolean(RewardedInterstitialAd),
    showAd,
    reloadAd: loadAd,
  };
}
