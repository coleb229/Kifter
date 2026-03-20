import { notFound, redirect } from "next/navigation";
import { getPublishedGuideBySlug } from "@/actions/published-guide-actions";
import { PublishedGuideView } from "@/components/training/published-guide-view";
import { auth } from "@/auth";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const result = await getPublishedGuideBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const guide = result.data;

  // Drafts redirect non-admins to the guides list
  if (guide.status === "draft" && !isAdmin) {
    redirect("/training/guides");
  }

  return (
    <div className="animate-fade-up">
      <PublishedGuideView guide={guide} isDraft={guide.status === "draft"} />
    </div>
  );
}

export function generateStaticParams() {
  return [];
}
