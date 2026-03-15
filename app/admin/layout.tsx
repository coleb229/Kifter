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
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="flex gap-1 border-b border-border pb-4">
          <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            Administration
          </Link>
          <Link href="/admin/dev" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            Development
          </Link>
        </nav>
      </div>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
