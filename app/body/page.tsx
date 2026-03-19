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
import { CompositionTimeline } from "@/components/body/composition-timeline";
import { MacroCorrelationChart } from "@/components/body/macro-correlation-chart";
import { getMacroCorrelationData } from "@/actions/diet-actions";

export default async function BodyPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [result, photosResult, physiqueResult, correlationResult] = await Promise.all([
    getBodyWeightHistory(),
    getProgressPhotos(),
    getPhysiqueMeasurements(),
    getMacroCorrelationData(),
  ]);
  const entries = result.success ? result.data : [];
  const photos = photosResult.success ? photosResult.data : [];
  const measurements = physiqueResult.success ? physiqueResult.data : [];
  const correlationData = correlationResult.success ? correlationResult.data : [];

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
          {(entries.length > 0 || measurements.length > 0) && (
            <div className="animate-fade-up" style={{ animationDelay: "40ms" }}>
              <CompositionTimeline bodyWeights={entries} measurements={measurements} photos={photos} />
            </div>
          )}
          {correlationData.length > 0 && (
            <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
              <h2 className="mb-3 text-base font-semibold">Nutrition vs Body Weight</h2>
              <div className="rounded-xl border border-border bg-card p-4">
                <MacroCorrelationChart data={correlationData} />
              </div>
            </div>
          )}
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
