import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBodyWeightHistory } from "@/actions/body-weight-actions";
import { Navbar } from "@/components/navbar";
import { BodyWeightView } from "@/components/body/body-weight-view";

export default async function BodyPage() {
  const session = await auth();
  if (!session) redirect("/");

  const result = await getBodyWeightHistory();
  const entries = result.success ? result.data : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight">Body Weight</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} logged
          </p>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <BodyWeightView initialEntries={entries} />
        </div>
      </main>
    </div>
  );
}
