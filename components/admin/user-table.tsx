"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@base-ui/react/avatar";
import { SlidersHorizontal } from "lucide-react";
import { setUserRole, toggleBan } from "@/actions/admin-actions";
import { UserDetailDrawer } from "@/components/admin/user-detail-drawer";
import type { UserRole, UserSummary } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface Props {
  users: UserSummary[];
  currentUserId: string;
}

const ROLES: UserRole[] = ["admin", "member", "restricted"];

const roleBadge: Record<UserRole, string> = {
  admin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  member: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  restricted: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

function UserRow({
  user,
  isSelf,
  onViewDetails,
}: {
  user: UserSummary;
  isSelf: boolean;
  onViewDetails: () => void;
}) {
  const router = useRouter();
  const [isPendingRole, startRoleTransition] = useTransition();
  const [isPendingBan, startBanTransition] = useTransition();
  const [confirmAdminId, setConfirmAdminId] = useState<string | null>(null);
  const isBanned = !!user.bannedAt;

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole;
    if (role === "admin") {
      setConfirmAdminId(user.id);
      return;
    }
    startRoleTransition(async () => {
      await setUserRole(user.id, role);
      router.refresh();
    });
  }

  function confirmAdminPromotion() {
    setConfirmAdminId(null);
    startRoleTransition(async () => {
      await setUserRole(user.id, "admin");
      router.refresh();
    });
  }

  function handleBanToggle() {
    startBanTransition(async () => {
      await toggleBan(user.id);
      router.refresh();
    });
  }

  const avatarSrc = user.profileImage ?? user.image ?? undefined;
  const initials = (user.displayName ?? user.name ?? user.email)[0]?.toUpperCase() ?? "?";
  const displayName = user.displayName ?? user.name ?? user.email;
  const joinedText = user.createdAt
    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
    : "—";

  return (
    <>
      {confirmAdminId && (
        <tr className="bg-amber-50/50 dark:bg-amber-950/10">
          <td colSpan={5} className="px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm">
                Promote <strong>{displayName}</strong> to admin? They will have full access to all admin panels.
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={confirmAdminPromotion}
                  className="rounded-lg bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAdminId(null)}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
      <tr className="border-b border-border last:border-0">
        {/* User */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar.Root className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              <Avatar.Image src={avatarSrc} alt={displayName} className="size-full object-cover" />
              <Avatar.Fallback className="text-xs font-semibold text-muted-foreground">
                {initials}
              </Avatar.Fallback>
            </Avatar.Root>
            <div>
              <p className="text-sm font-medium leading-none">
                {displayName}
                {isSelf && (
                  <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                    You
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </td>

        {/* Joined */}
        <td className="hidden py-3 pr-4 text-xs text-muted-foreground sm:table-cell">
          {joinedText}
        </td>

        {/* Role */}
        <td className="py-3 pr-4">
          {isSelf ? (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[user.role]}`}>
              {user.role}
            </span>
          ) : (
            <select
              value={user.role}
              onChange={handleRoleChange}
              disabled={isPendingRole || isSelf}
              title={user.role === "restricted" ? "Restricted: cannot create community posts" : undefined}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} title={r === "restricted" ? "Cannot create community posts" : undefined}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </td>

        {/* Status */}
        <td className="hidden py-3 pr-4 sm:table-cell">
          {isBanned ? (
            <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-destructive/10 text-destructive">
              Banned
            </span>
          ) : (() => {
            const lastSeen = user.lastSeenAt ? new Date(user.lastSeenAt) : null;
            const minAgo = lastSeen ? (Date.now() - lastSeen.getTime()) / 60_000 : Infinity;
            const dotColor = minAgo < 2 ? "bg-emerald-500" : minAgo < 15 ? "bg-amber-400" : "bg-muted-foreground/40";
            const label = minAgo < 2 ? "Online" : minAgo < 15 ? "Away" : "Offline";
            const textColor = minAgo < 2 ? "text-emerald-700 dark:text-emerald-300" : minAgo < 15 ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground";
            return (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
                <span className={`size-1.5 rounded-full ${dotColor}`} />
                {label}
              </span>
            );
          })()}
        </td>

        {/* Actions */}
        <td className="py-3">
          <div className="flex items-center gap-2">
            {!isSelf && (
              <button
                type="button"
                onClick={handleBanToggle}
                disabled={isPendingBan}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                  isBanned
                    ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                    : "border-destructive/40 text-destructive hover:bg-destructive/10"
                }`}
              >
                {isPendingBan ? "…" : isBanned ? "Unban" : "Ban"}
              </button>
            )}
            <button
              type="button"
              onClick={onViewDetails}
              title="View details & restrictions"
              className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <SlidersHorizontal className="size-3.5" />
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}

export function UserTable({ users, currentUserId }: Props) {
  const [drawerUser, setDrawerUser] = useState<UserSummary | null>(null);

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  User
                </th>
                <th className="hidden px-0 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Joined
                </th>
                <th className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Role
                </th>
                <th className="hidden py-3 pr-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Status
                </th>
                <th className="py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="px-4">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === currentUserId}
                  onViewDetails={() => setDrawerUser(user)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerUser && (
        <UserDetailDrawer user={drawerUser} onClose={() => setDrawerUser(null)} />
      )}
    </>
  );
}
