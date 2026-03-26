import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Progress",
  description: "Track your weekly habit streaks and analyze your urge patterns.",
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}