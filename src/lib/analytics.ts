import PostHog from 'posthog-react-native';

const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;

export const posthog = key
  ? new PostHog(key, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      captureAppLifecycleEvents: true,
      disableGeoip: true,
    })
  : null;

export const capture = (event: string, properties?: Record<string, string | number | boolean>) => {
  posthog?.capture(event, properties);
};

export const trackScreen = (screen: string) => posthog?.screen(screen);
