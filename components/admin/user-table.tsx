"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@base-ui/react/avatar";
import { setUserRole, toggleBan } from "@/actions/admin-actions";
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
}: {
  user: UserSummary;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPendingRole, startRoleTransition] = useTransition();
  const [isPendingBan, startBanTransition] = useTransition();
  const isBanned = !!user.bannedAt;

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole;
    startRoleTransition(async () => {
      await setUserRole(user.id, role);
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
    <tr className="border-b border-border last:border-0">
      {/* User */}
      <td className="py-3 pr-4">
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
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
      </td>

      {/* Status */}
      <td className="py-3 pr-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isBanned
              ? "bg-destructive/10 text-destructive"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          }`}
        >
          {isBanned ? "Banned" : "Active"}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3">
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
      </td>
    </tr>
  );
}

export function UserTable({ users, currentUserId }: Props) {
  return (
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
              <th className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <th className="py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="px-4">
            {users.map((user, i) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
