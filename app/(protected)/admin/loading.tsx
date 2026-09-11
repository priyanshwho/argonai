import { Shield } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto animate-pulse">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Loading admin dashboard...</p>
      </div>
    </div>
  );
}
