import { getPrograms } from "@/actions/program-actions";
import { ProgramsView } from "@/components/training/programs-view";

export default async function ProgramsPage() {
  const result = await getPrograms();
  const programs = result.success ? result.data : [];

  return <ProgramsView initialPrograms={programs} />;
}
