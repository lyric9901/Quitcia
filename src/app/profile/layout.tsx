// @/app/profile/layout.tsx
import type { Metadata } from "next";

// This will output "My Profile | Quitcia" in the browser tab
export const metadata: Metadata = {
  title: "My Profile",
  description: "View your habit rewiring statistics, all-time audio sessions, and account details on Quitcia.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}