import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminWorkspace } from "@/components/admin-workspace";
import { auth, isAdminEmail } from "@/auth";
import { listEvents } from "@/lib/backend-api";
import { isAuthBypassed } from "@/lib/auth-flags";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const bypassAuth = isAuthBypassed();
  const session = bypassAuth ? null : await auth();

  if (!bypassAuth && !isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const events = await listEvents(true);

  return (
    <main className="shell admin-shell">
      <SiteHeader />
      <div className="page admin-page">
        <AdminWorkspace events={events} />
      </div>
    </main>
  );
}
