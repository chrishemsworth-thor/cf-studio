import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface-base)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header session={session} title="CF Studio" />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
