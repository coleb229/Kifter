import { SessionForm } from "@/components/training/session-form";

export default function NewWorkoutPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">New Session</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your session, then log exercises as you go
        </p>
      </div>
      <SessionForm />
    </div>
  );
}
