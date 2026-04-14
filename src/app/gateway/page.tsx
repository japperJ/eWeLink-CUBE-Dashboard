import { GatewayInfoCard } from "@/components/gateway/gateway-info-card";
import { SystemStatsCard } from "@/components/gateway/system-stats-card";

export default function GatewayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gateway</h1>
        <p className="text-sm text-muted-foreground">
          eWeLink CUBE gateway information and performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GatewayInfoCard />
        <SystemStatsCard />
      </div>
    </div>
  );
}
