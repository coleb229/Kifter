import { Code2, Plug, BookOpen, Bug } from "lucide-react";
import { auth } from "@/auth";
import { getSiteSettings } from "@/actions/settings-actions";
import { getBugReports } from "@/actions/bug-report-actions";
import { getUserSuggestions } from "@/actions/suggestion-actions";
import { getClaudeIdeas } from "@/actions/claude-ideas-actions";
import { getTrainingGuides } from "@/actions/guide-actions";
import { getPublishedGuides } from "@/actions/published-guide-actions";
import { getUserExercises } from "@/actions/workout-actions";
import { ApiDocs } from "@/components/admin/api-docs";
import { IntegrationsPanel } from "@/components/admin/integrations-panel";
import { BugReportsPanel } from "@/components/admin/bug-reports-panel";
import { UserSuggestionsPanel } from "@/components/admin/user-suggestions-panel";
import { ClaudeIdeasPanel } from "@/components/admin/claude-ideas-panel";
import { TrainingContentPanel } from "@/components/admin/training-content-panel";
import { PublishedGuidesPanel } from "@/components/admin/published-guides-panel";
import { SectionSubnav } from "@/components/ui/section-subnav";

function Section({ icon: Icon, title, description, children, id }: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="flex scroll-mt-14 flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
          <Icon className="size-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function DevPanelPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const perms = session?.user?.adminPermissions ?? {};
  const canViewBugReports = isAdmin || perms.viewBugReports;
  const canManageSuggestions = isAdmin || perms.manageSuggestions;

  const settingsResult = await getSiteSettings();
  const settings = settingsResult.success
    ? settingsResult.data
    : { _id: "global", maintenanceMode: false, features: { training: true, nutrition: true, cardio: true, community: true } };

  const [bugsResult, suggestionsResult, claudeIdeasResult, guidesResult, exercisesResult, publishedGuidesResult] = await Promise.all([
    canViewBugReports ? getBugReports() : Promise.resolve({ success: true as const, data: [] }),
    canManageSuggestions ? getUserSuggestions() : Promise.resolve({ success: true as const, data: [] }),
    isAdmin ? getClaudeIdeas() : Promise.resolve({ success: true as const, data: [] }),
    isAdmin ? getTrainingGuides() : Promise.resolve({ success: true as const, data: [] }),
    isAdmin ? getUserExercises() : Promise.resolve({ success: true as const, data: [] }),
    isAdmin ? getPublishedGuides(true) : Promise.resolve({ success: true as const, data: [] }),
  ]);

  const integrations = [
    {
      name: "Anthropic Claude AI",
      description: "Powers AI coaching insights and admin analytics",
      configured: !!process.env.ANTHROPIC_API_KEY,
      docsUrl: "https://console.anthropic.com",
      settingsKey: "anthropic" as const,
    },
    {
      name: "Google OAuth",
      description: "Provides sign-in via Google accounts",
      configured: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
      docsUrl: "https://console.cloud.google.com",
      settingsKey: "google" as const,
    },
    {
      name: "UploadThing",
      description: "Handles profile image file uploads",
      configured: !!process.env.UPLOADTHING_TOKEN,
      docsUrl: "https://uploadthing.com/dashboard",
      settingsKey: "uploadthing" as const,
    },
    {
      name: "MongoDB",
      description: "Primary database for all app data",
      configured: !!process.env.MONGODB_URI,
      docsUrl: "https://cloud.mongodb.com",
    },
    {
      name: "Apple Health Import",
      description: "Allows users to import cardio data from Apple Health XML exports",
      configured: true,
      docsUrl: "https://support.apple.com/en-us/111829",
      settingsKey: "appleHealth" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Development Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Integrations, feedback tracking, AI workflows, and API reference
        </p>
      </div>

      <SectionSubnav items={[
        { label: "Integrations", id: "integrations" },
        ...(canManageSuggestions || canViewBugReports || isAdmin ? [{ label: "Feedback & Ideas", id: "feedback" }] : []),
        ...(isAdmin ? [{ label: "Course Content", id: "content" }] : []),
        { label: "API Reference", id: "api" },
      ]} />

      <Section id="integrations" icon={Plug} title="External Integrations" description="Status of all connected third-party services">
        <IntegrationsPanel integrations={integrations} settings={settings.integrations ?? {}} />
      </Section>

      <div className="border-t border-border" />

      {/* Feedback & Ideas — Bug reports, user suggestions, Claude's good ideas */}
      {(canManageSuggestions || canViewBugReports || isAdmin) && (
        <>
          <Section id="feedback" icon={Bug} title="Feedback & Ideas" description="Bug reports, user suggestions, and AI-generated improvement ideas">
            <div className="flex flex-col gap-8">
              {canManageSuggestions && (
                <UserSuggestionsPanel initialSuggestions={suggestionsResult.success ? suggestionsResult.data : []} />
              )}
              {canViewBugReports && (
                <BugReportsPanel initialReports={bugsResult.success ? bugsResult.data : []} />
              )}
              {isAdmin && (
                <ClaudeIdeasPanel initialIdeas={claudeIdeasResult.success ? claudeIdeasResult.data : []} />
              )}
            </div>
          </Section>

          <div className="border-t border-border" />
        </>
      )}

      {/* Training Content — AI guide generation workflow */}
      {isAdmin && (
        <>
          <Section id="content" icon={BookOpen} title="Course Content" description="AI-powered guide transcription and publishing workflow">
            <div className="flex flex-col gap-8">
              <TrainingContentPanel
                initialGuides={guidesResult.success ? guidesResult.data : []}
                exercises={exercisesResult.success ? exercisesResult.data : []}
              />
              <PublishedGuidesPanel
                initialGuides={publishedGuidesResult.success ? publishedGuidesResult.data : []}
                sourceGuides={guidesResult.success ? guidesResult.data : []}
              />
            </div>
          </Section>

          <div className="border-t border-border" />
        </>
      )}

      <Section id="api" icon={Code2} title="API Reference" description="All server actions grouped by domain">
        <ApiDocs />
      </Section>
    </div>
  );
}
