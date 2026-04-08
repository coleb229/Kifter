import { ShieldCheck, Settings2, ChefHat } from "lucide-react";
import { getAllUsers } from "@/actions/admin-actions";
import { getSiteSettings } from "@/actions/settings-actions";
import { getRecipeSubmissions } from "@/actions/pantry-actions";
import { UserTable } from "@/components/admin/user-table";
import { AISiteInsights } from "@/components/admin/ai-site-insights";
import { GlobalSettingsPanel } from "@/components/admin/global-settings-panel";
import { RecipeSubmissionsPanel } from "@/components/admin/recipe-submissions-panel";
import { SectionSubnav } from "@/components/ui/section-subnav";
import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const perms = session?.user?.adminPermissions ?? {};
  const canManageUsers = isAdmin || perms.manageUsers;

  const [result, settingsResult, submissionsResult] = await Promise.all([
    canManageUsers ? getAllUsers() : Promise.resolve({ success: true as const, data: [] }),
    getSiteSettings(),
    isAdmin ? getRecipeSubmissions() : Promise.resolve({ success: true as const, data: [] }),
  ]);
  const users = result.success ? result.data : [];
  const settings = settingsResult.success
    ? settingsResult.data
    : { _id: "global", maintenanceMode: false, features: { training: true, nutrition: true, cardio: true, community: true } };
  const submissions = submissionsResult.success ? submissionsResult.data : [];

  return (
    <div>
      <div className="mb-8 flex items-center gap-3 animate-fade-up">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
          <ShieldCheck className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            {canManageUsers ? `${users.length} user${users.length !== 1 ? "s" : ""} registered` : "Limited access"}
          </p>
        </div>
      </div>

      <SectionSubnav stickyTop="top-28" items={[
        { label: "Users", id: "users" },
        { label: "Recipe Submissions", id: "recipe-submissions" },
        { label: "Settings", id: "settings" },
      ]} />

      <section id="users" className="scroll-mt-28">
        {canManageUsers && (
          !result.success ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              Failed to load users: {result.error}
            </div>
          ) : (
            <>
              <UserTable users={users} currentUserId={session!.user.id} />
              {isAdmin && (
                <div className="mt-8">
                  <AISiteInsights />
                </div>
              )}
            </>
          )
        )}
      </section>

      <div className="my-12 border-t border-border" />

      {isAdmin && (
        <section id="recipe-submissions" className="scroll-mt-28">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
              <ChefHat className="size-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Recipe Submissions</h2>
              <p className="text-xs text-muted-foreground">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <RecipeSubmissionsPanel submissions={submissions} />
          <div className="my-12 border-t border-border" />
        </section>
      )}

      <section id="settings" className="scroll-mt-28">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
            <Settings2 className="size-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Global Settings</h2>
            <p className="text-xs text-muted-foreground">Site-wide feature flags and maintenance mode</p>
          </div>
        </div>
        <GlobalSettingsPanel settings={settings} />
      </section>
    </div>
  );
}
