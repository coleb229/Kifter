import { ShieldCheck } from "lucide-react";
import { getAllUsers } from "@/actions/admin-actions";
import { getBugReports } from "@/actions/bug-report-actions";
import { getUserSuggestions } from "@/actions/suggestion-actions";
import { UserTable } from "@/components/admin/user-table";
import { AISiteInsights } from "@/components/admin/ai-site-insights";
import { BugReportsPanel } from "@/components/admin/bug-reports-panel";
import { UserSuggestionsPanel } from "@/components/admin/user-suggestions-panel";
import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();
  const [result, bugsResult, suggestionsResult] = await Promise.all([getAllUsers(), getBugReports(), getUserSuggestions()]);
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
            {users.length} user{users.length !== 1 ? "s" : ""} registered
          </p>
        </div>
      </div>

      {!result.success ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Failed to load users: {result.error}
        </div>
      ) : (
        <>
          <UserTable users={users} currentUserId={session!.user.id} />
          <div className="mt-8">
            <AISiteInsights />
          </div>
          <div className="mt-8">
            <UserSuggestionsPanel initialSuggestions={suggestionsResult.success ? suggestionsResult.data : []} />
          </div>
          <div className="mt-8">
            <BugReportsPanel initialReports={bugsResult.success ? bugsResult.data : []} />
          </div>
        </>
      )}
    </div>
  );
}
