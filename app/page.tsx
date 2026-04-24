import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { fetchThemesWithProgress, fetchRecentOutputs } from "@/lib/generate";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [themes, outputs] = await Promise.all([fetchThemesWithProgress(), fetchRecentOutputs()]);

  return <DashboardShell initialOutputs={outputs} initialThemes={themes} />;
}
