import { Code2, Settings2, Plug } from "lucide-react";
import { getSiteSettings } from "@/actions/settings-actions";
import { GlobalSettingsPanel } from "@/components/admin/global-settings-panel";
import { ApiDocs } from "@/components/admin/api-docs";
import { IntegrationsPanel } from "@/components/admin/integrations-panel";

function Section({ icon: Icon, title, description, children }: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
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
  const settingsResult = await getSiteSettings();
  const settings = settingsResult.success
    ? settingsResult.data
    : { _id: "global", maintenanceMode: false, features: { training: true, nutrition: true, cardio: true, community: true } };

  const integrations = [
    {
      name: "Anthropic Claude AI",
      description: "Powers AI coaching insights and admin analytics",
      configured: !!process.env.ANTHROPIC_API_KEY,
      docsUrl: "https://console.anthropic.com",
    },
    {
      name: "UploadThing",
      description: "Handles profile image file uploads",
      configured: !!process.env.UPLOADTHING_TOKEN,
      docsUrl: "https://uploadthing.com/dashboard",
    },
    {
      name: "Google OAuth",
      description: "Provides sign-in via Google accounts",
      configured: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
      docsUrl: "https://console.cloud.google.com",
    },
    {
      name: "MongoDB",
      description: "Primary database for all app data",
      configured: !!process.env.MONGODB_URI,
      docsUrl: "https://cloud.mongodb.com",
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Development Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Global settings, API reference, and integration status
        </p>
      </div>

      <Section icon={Settings2} title="Global Settings" description="Site-wide feature flags and maintenance mode">
        <GlobalSettingsPanel settings={settings} />
      </Section>

      <div className="border-t border-border" />

      <Section icon={Plug} title="External Integrations" description="Status of all connected third-party services">
        <IntegrationsPanel integrations={integrations} />
      </Section>

      <div className="border-t border-border" />

      <Section icon={Code2} title="API Reference" description="All server actions grouped by domain">
        <ApiDocs />
      </Section>
    </div>
  );
}
