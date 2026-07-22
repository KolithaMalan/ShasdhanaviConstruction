import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settingsService";
import { getDisabledFeatures } from "@/lib/featureService";
import { blockedPageFor } from "@/lib/features";
import { roleToDashboard } from "@/config/roles";

import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { MaintenanceScreen } from "@/components/shared/MaintenanceScreen";
import { FeatureDisabledScreen } from "@/components/shared/FeatureDisabledScreen";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/");
  }

  const { name, email, role } = session.user;

  /* Maintenance mode — everyone except Super Admins is locked out while on.
     Super Admins keep access but see a reminder banner. */
  const settings = await getSettings();
  if (settings.maintenanceMode && role !== "SUPER_ADMIN") {
    return <MaintenanceScreen message={settings.maintenanceMessage} />;
  }

  /* Per-role feature switches (Super Admin → Role Features). Disabled screens
     are dropped from the sidebar and the route itself is blocked. The pathname
     comes from middleware, which sets `x-pathname` on the request. */
  const disabledFeatures = await getDisabledFeatures(role);
  const pathname = (await headers()).get("x-pathname") ?? "";
  const blockedLabel = blockedPageFor(role, disabledFeatures, pathname);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={role} disabledFeatures={disabledFeatures} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={name ?? "User"} email={email ?? ""} role={role} disabledFeatures={disabledFeatures} />
        {settings.maintenanceMode && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-400 md:px-8">
            Maintenance mode is ON — all non–Super Admin users are currently locked out.
          </div>
        )}
        <main className="flex-1 p-4 md:p-8">
          {blockedLabel ? (
            <FeatureDisabledScreen
              featureLabel={blockedLabel}
              dashboardPath={roleToDashboard[role]}
            />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
