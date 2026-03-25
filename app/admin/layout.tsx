import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/");
  const isAdmin = session.user.role === "admin";
  const hasAnyAdminPermission = session.user.adminPermissions &&
    Object.values(session.user.adminPermissions).some(Boolean);
  if (!isAdmin && !hasAnyAdminPermission) redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="sticky top-14 z-40 w-full border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1 pb-4">
          <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            Administration
          </Link>
          <Link href="/admin/dev" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            Development
          </Link>
        </nav>
        </div>
      </div>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-40 sm:px-6 sm:pb-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
