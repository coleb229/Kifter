import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBodyWeightHistory } from "@/actions/body-weight-actions";
import { getProgressPhotos } from "@/actions/progress-photo-actions";
import { getPhysiqueMeasurements } from "@/actions/physique-actions";
import { getCurrentUser } from "@/actions/user-actions";
import { Navbar } from "@/components/navbar";
import { BodyPageClient } from "@/components/body/body-page-client";
import { getMacroCorrelationData } from "@/actions/diet-actions";

export default async function BodyPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [result, photosResult, physiqueResult, correlationResult, userResult] = await Promise.all([
    getBodyWeightHistory(),
    getProgressPhotos(),
    getPhysiqueMeasurements(),
    getMacroCorrelationData(),
    getCurrentUser(),
  ]);
  const entries = result.success ? result.data : [];
  const photos = photosResult.success ? photosResult.data : [];
  const measurements = physiqueResult.success ? physiqueResult.data : [];
  const correlationData = correlationResult.success ? correlationResult.data : [];
  const defaultUnit = (userResult.success ? userResult.data.preferences?.defaultWeightUnit : null) ?? "lb";

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
        <BodyPageClient
          entries={entries}
          photos={photos}
          measurements={measurements}
          correlationData={correlationData}
          defaultUnit={defaultUnit as "lb" | "kg"}
        />
      </main>
    </div>
  );
}
