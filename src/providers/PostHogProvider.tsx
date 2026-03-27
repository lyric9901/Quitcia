'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

// 1. Initialize PostHog OUTSIDE the component to prevent double-firing
if (typeof window !== 'undefined') {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  // 2. Add a safety check so the app doesn't crash if the token is missing
  if (token) {
    posthog.init(token, {
      api_host: host,
      person_profiles: 'identified_only',
      capture_pageview: false // Set to false if you plan to track pageviews manually in Next.js
    })
  } else {
    console.warn("PostHog token is missing! Check your .env.local file.");
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}