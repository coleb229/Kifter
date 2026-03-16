import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBodyWeightHistory } from "@/actions/body-weight-actions";
import { getProgressPhotos } from "@/actions/progress-photo-actions";
import { getPhysiqueMeasurements } from "@/actions/physique-actions";
import { Navbar } from "@/components/navbar";
import { BodyWeightView } from "@/components/body/body-weight-view";
import { ProgressGallery } from "@/components/body/progress-gallery";
import { PhysiqueView } from "@/components/body/physique-view";
import { PoseComparison } from "@/components/body/pose-comparison";

export default async function BodyPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [result, photosResult, physiqueResult] = await Promise.all([
    getBodyWeightHistory(),
    getProgressPhotos(),
    getPhysiqueMeasurements(),
  ]);
  const entries = result.success ? result.data : [];
  const photos = photosResult.success ? photosResult.data : [];
  const measurements = physiqueResult.success ? physiqueResult.data : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight">Body</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weight, measurements, and progress photos
          </p>
        </div>
        <div className="flex flex-col gap-12">
          <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
            <BodyWeightView initialEntries={entries} />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <PhysiqueView initialMeasurements={measurements} />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "140ms" }}>
            <ProgressGallery initialPhotos={photos} />
          </div>
          {photos.length >= 2 && (
            <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
              <PoseComparison photos={photos} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
