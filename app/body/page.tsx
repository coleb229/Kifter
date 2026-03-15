import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBodyWeightHistory } from "@/actions/body-weight-actions";
import { getProgressPhotos } from "@/actions/progress-photo-actions";
import { Navbar } from "@/components/navbar";
import { BodyWeightView } from "@/components/body/body-weight-view";
import { ProgressGallery } from "@/components/body/progress-gallery";

export default async function BodyPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [result, photosResult] = await Promise.all([
    getBodyWeightHistory(),
    getProgressPhotos(),
  ]);
  const entries = result.success ? result.data : [];
  const photos = photosResult.success ? photosResult.data : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight">Body Weight</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} logged
          </p>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <BodyWeightView initialEntries={entries} />
        </div>
        <div className="mt-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <ProgressGallery initialPhotos={photos} />
        </div>
      </main>
    </div>
  );
}
