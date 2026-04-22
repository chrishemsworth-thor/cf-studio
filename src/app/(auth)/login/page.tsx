import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { SignInButtons } from "@/components/auth/sign-in-buttons";

export default async function LoginPage() {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-base)]">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/30">
            <svg className="size-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">CF Studio</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Sign in to manage your Cloudflare resources
          </p>
        </div>
        <SignInButtons />
      </div>
    </div>
  );
}
