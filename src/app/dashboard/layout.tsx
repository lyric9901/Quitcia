import DailyCheckIn from "@/components/DailyCheckIn";
import BottomNav from "@/components/BottomNav"; // Assuming you have this

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Wrap the entire dashboard experience in the DailyCheckIn gatekeeper
    <DailyCheckIn>
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#09090B]">
        <main className="flex-1 pb-20"> {/* pb-20 leaves room for BottomNav */}
          {children}
        </main>
        <BottomNav />
      </div>
    </DailyCheckIn>
  );
}