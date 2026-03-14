import { getCurrentUser } from "@/actions/user-actions";
import { PreferencesForm } from "@/components/settings/preferences-form";

export default async function PreferencesSettingsPage() {
  const result = await getCurrentUser();
  const user = result.success ? result.data : null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 text-base font-semibold">Preferences</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Customize how Kifted works for you
      </p>
      <PreferencesForm user={user} />
    </div>
  );
}
