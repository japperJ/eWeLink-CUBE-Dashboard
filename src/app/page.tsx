import { PowerConsumptionChart } from "@/components/devices/power-consumption-chart";
import { DashboardWidgets } from "@/components/widgets/dashboard-widgets";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and control all your devices
        </p>
      </div>

      <PowerConsumptionChart />
      <DashboardWidgets />
    </div>
  );
}
