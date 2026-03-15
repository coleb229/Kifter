import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CardioSessionForm } from "@/components/cardio/cardio-session-form";

export default function NewCardioPage() {
  return (
    <div>
      <Link
        href="/cardio"
        className="mb-6 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All sessions
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Log Cardio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record your activity, duration, and effort
        </p>
      </div>

      <CardioSessionForm />
    </div>
  );
}
