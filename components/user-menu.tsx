"use client";

import { Menu } from "@base-ui/react/menu";
import { Avatar } from "@base-ui/react/avatar";
import { ChevronDown, Dumbbell, LogOut, Settings, Users, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/actions/auth-actions";
import type { UserRole } from "@/types";

interface UserMenuProps {
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
  role?: UserRole;
}

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

const menuItem =
  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted focus-visible:bg-muted";

export function UserMenu({ name, email, image, role }: UserMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="User menu"
      >
        <Avatar.Root className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          <Avatar.Image
            src={image ?? undefined}
            alt={name ?? "User"}
            className="size-full object-cover"
          />
          <Avatar.Fallback className="text-xs font-semibold text-muted-foreground">
            {getInitials(name, email)}
          </Avatar.Fallback>
        </Avatar.Root>
        <span className="hidden max-w-28 truncate sm:block">{name ?? email}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8}>
          <Menu.Popup className="z-50 min-w-48 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
            {/* Header */}
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <Menu.Separator className="my-1 h-px bg-border" />

            {/* Navigation links */}
            <Menu.LinkItem href="/training" className={menuItem}>
              <Dumbbell className="size-4 text-muted-foreground" />
              Training
            </Menu.LinkItem>
            <Menu.LinkItem href="/community" className={menuItem}>
              <Users className="size-4 text-muted-foreground" />
              Community
            </Menu.LinkItem>
            <Menu.LinkItem href="/settings" className={menuItem}>
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </Menu.LinkItem>

            {role === "admin" && (
              <>
                <Menu.Separator className="my-1 h-px bg-border" />
                <Menu.LinkItem href="/admin" className={menuItem}>
                  <ShieldCheck className="size-4 text-indigo-500" />
                  <span className="text-indigo-600 dark:text-indigo-400">Admin Panel</span>
                </Menu.LinkItem>
              </>
            )}

            <Menu.Separator className="my-1 h-px bg-border" />

            {/* Sign out */}
            <Menu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
              onClick={() => signOutAction()}
            >
              <LogOut className="size-4" />
              Sign Out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
