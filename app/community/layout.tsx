import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import { Lock } from "lucide-react";

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/");

  if (session.user.role === "restricted") {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Access restricted</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Your account doesn&apos;t have access to the community yet. Contact an
              admin to request access.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
