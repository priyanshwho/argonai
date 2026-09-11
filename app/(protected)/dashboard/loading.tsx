export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground font-sans">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="h-10 w-10 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <span className="text-sm text-muted-foreground font-medium">Loading workspace...</span>
      </div>
    </div>
  );
}
