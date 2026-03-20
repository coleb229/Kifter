import { ShieldCheck } from "lucide-react";
import { getAllUsers } from "@/actions/admin-actions";
import { getBugReports } from "@/actions/bug-report-actions";
import { getUserSuggestions } from "@/actions/suggestion-actions";
import { getClaudeIdeas } from "@/actions/claude-ideas-actions";
import { getTrainingGuides } from "@/actions/guide-actions";
import { getPublishedGuides } from "@/actions/published-guide-actions";
import { getUserExercises } from "@/actions/workout-actions";
import { UserTable } from "@/components/admin/user-table";
import { AISiteInsights } from "@/components/admin/ai-site-insights";
import { BugReportsPanel } from "@/components/admin/bug-reports-panel";
import { UserSuggestionsPanel } from "@/components/admin/user-suggestions-panel";
import { ClaudeIdeasPanel } from "@/components/admin/claude-ideas-panel";
import { TrainingContentPanel } from "@/components/admin/training-content-panel";
import { PublishedGuidesPanel } from "@/components/admin/published-guides-panel";
import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const perms = session?.user?.adminPermissions ?? {};
  const canManageUsers = isAdmin || perms.manageUsers;
  const canViewBugReports = isAdmin || perms.viewBugReports;
  const canManageSuggestions = isAdmin || perms.manageSuggestions;

  const [result, bugsResult, suggestionsResult, claudeIdeasResult, guidesResult, exercisesResult, publishedGuidesResult] = await Promise.all([
    canManageUsers ? getAllUsers() : Promise.resolve({ success: true as const, data: [] }),
    canViewBugReports ? getBugReports() : Promise.resolve({ success: true as const, data: [] }),
    canManageSuggestions ? getUserSuggestions() : Promise.resolve({ success: true as const, data: [] }),
    isAdmin ? getClaudeIdeas() : Promise.resolve({ success: true as const, data: [] }),
    isAdmin ? getTrainingGuides() : Promise.resolve({ success: true as const, data: [] }),
    isAdmin ? getUserExercises() : Promise.resolve({ success: true as const, data: [] }),
    isAdmin ? getPublishedGuides(true) : Promise.resolve({ success: true as const, data: [] }),
  ]);
  const users = result.success ? result.data : [];

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

      {canManageSuggestions && (
        <div className="mt-8">
          <UserSuggestionsPanel initialSuggestions={suggestionsResult.success ? suggestionsResult.data : []} />
        </div>
      )}

      {canViewBugReports && (
        <div className="mt-8">
          <BugReportsPanel initialReports={bugsResult.success ? bugsResult.data : []} />
        </div>
      )}

      {isAdmin && (
        <div className="mt-8">
          <ClaudeIdeasPanel initialIdeas={claudeIdeasResult.success ? claudeIdeasResult.data : []} />
        </div>
      )}

      {isAdmin && (
        <div className="mt-8">
          <TrainingContentPanel
            initialGuides={guidesResult.success ? guidesResult.data : []}
            exercises={exercisesResult.success ? exercisesResult.data : []}
          />
        </div>
      )}

      {isAdmin && (
        <div className="mt-8">
          <PublishedGuidesPanel
            initialGuides={publishedGuidesResult.success ? publishedGuidesResult.data : []}
            sourceGuides={guidesResult.success ? guidesResult.data : []}
          />
        </div>
      )}
    </div>
  );
}
