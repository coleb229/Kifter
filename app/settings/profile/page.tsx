import { getCurrentUser } from "@/actions/user-actions";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function ProfileSettingsPage() {
  const result = await getCurrentUser();
  const user = result.success ? result.data : null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 text-base font-semibold">Profile</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        How you appear to others on Kifted
      </p>
      <ProfileForm user={user} />
    </div>
  );
}
