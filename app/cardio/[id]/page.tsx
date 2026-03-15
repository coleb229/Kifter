export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCardioSession } from "@/actions/cardio-actions";
import { CardioSessionDetail } from "@/components/cardio/cardio-session-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CardioSessionPage({ params }: Props) {
  const { id } = await params;
  const result = await getCardioSession(id);
  if (!result.success) notFound();

  return (
    <div>
      <Link
        href="/cardio"
        className="mb-6 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All sessions
      </Link>

      <CardioSessionDetail session={result.data} />
    </div>
  );
}
