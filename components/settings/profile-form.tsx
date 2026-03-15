"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@base-ui/react/avatar";
import { updateProfile, addProfileImageToHistory } from "@/actions/user-actions";
import { UploadButton } from "@/lib/uploadthing-client";
import type { UserSummary } from "@/types";

interface Props {
  user: UserSummary | null;
}

function getInitials(name?: string, email?: string) {
  if (name) return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return email?.[0]?.toUpperCase() ?? "?";
}

export function ProfileForm({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(user?.displayName ?? user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? user?.image ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarSrc = profileImage || undefined;
  const initials = getInitials(user?.displayName ?? user?.name, user?.email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({ displayName, bio, profileImage });
      if (result.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar.Root className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          <Avatar.Image
            src={avatarSrc}
            alt={displayName || "Avatar"}
            className="size-full object-cover"
          />
          <Avatar.Fallback className="text-lg font-semibold text-muted-foreground">
            {initials}
          </Avatar.Fallback>
        </Avatar.Root>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Profile photo</p>
          <UploadButton
            endpoint="profileImage"
            onClientUploadComplete={(res) => {
              if (res[0]?.url) {
                setProfileImage(res[0].url);
                addProfileImageToHistory(res[0].url);
              }
            }}
            onUploadError={(err) => setError(err.message)}
            appearance={{
              button:
                "ut-ready:bg-muted ut-ready:text-foreground ut-ready:border ut-ready:border-border ut-ready:hover:bg-muted/80 ut-uploading:bg-muted text-sm font-medium rounded-lg px-3 py-1.5 h-auto",
              allowedContent: "hidden",
            }}
            content={{ button: "Upload photo" }}
          />
          <p className="text-xs text-muted-foreground">JPG, PNG up to 4MB</p>
        </div>
      </div>

      {/* Previous uploads gallery */}
      {(user?.profileImages?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Previous photos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {user!.profileImages!.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setProfileImage(url)}
                className={`relative size-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  profileImage === url
                    ? "border-ring"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Previous photo" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Display name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={user?.name ?? "Your name"}
          maxLength={60}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <p className="text-xs text-muted-foreground">
          This is how your name appears in the community feed
        </p>
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="bio">
            Bio
          </label>
          <span className="text-xs text-muted-foreground">{bio.length}/280</span>
        </div>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 280))}
          placeholder="Tell the community about yourself…"
          rows={3}
          className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile saved!</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
