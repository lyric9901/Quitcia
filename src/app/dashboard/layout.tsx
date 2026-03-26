import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Log your urges, complete daily relief tasks, and practice breathing exercises.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}