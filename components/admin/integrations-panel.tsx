import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface Integration {
  name: string;
  description: string;
  configured: boolean;
  docsUrl: string;
}

interface Props {
  integrations: Integration[];
}

export function IntegrationsPanel({ integrations }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {integrations.map(({ name, description, configured, docsUrl }) => (
        <div
          key={name}
          className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-start gap-3">
            {configured ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
            )}
            <div>
              <p className="text-sm font-semibold">{name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              <span
                className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  configured
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {configured ? "Connected" : "Not configured"}
              </span>
            </div>
          </div>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`${name} dashboard`}
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      ))}
    </div>
  );
}
