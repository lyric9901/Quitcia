# Quitcia Native

Expo React Native app for Android and iOS.

## Run

```bash
bun install
bun run android
```

## Analytics

Uses `posthog-react-native`, not web-only `posthog-js` / `@posthog/react`.
`EXPO_PUBLIC_POSTHOG_KEY` and US Cloud host live in ignored `.env`.

Events include onboarding completion, screen views, daily tasks, urge logs, panic mode, audio sessions, and streak resets. Sensitive answers, names, and relapse reasons are never sent to PostHog.

## Included

- Offline local profile, streak, tasks, urge logs, and progress via AsyncStorage
- Guided offline urge-surfing audio
- Animated breathing-based panic mode
- Branded splash and launch UI using Quitcia logo
- Android background audio configuration without microphone permission
