"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { updateIntegrationSettings } from "@/actions/settings-actions";
import type { SiteSettingsDoc } from "@/types";

export interface IntegrationDef {
  name: string;
  description: string;
  configured: boolean;
  docsUrl: string;
  settingsKey?: keyof NonNullable<SiteSettingsDoc["integrations"]>;
}

interface Props {
  integrations: IntegrationDef[];
  settings: SiteSettingsDoc["integrations"];
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <span className={`block size-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function AnthropicSettings({
  initial,
  onSave,
  isPending,
  saved,
}: {
  initial: NonNullable<SiteSettingsDoc["integrations"]>["anthropic"];
  onSave: (cfg: Record<string, unknown>) => void;
  isPending: boolean;
  saved: boolean;
}) {
  const [model, setModel] = useState(initial?.defaultModel ?? "claude-sonnet-4-6");
  return (
    <div className="flex flex-col gap-3">
      <SettingsRow label="Default model" description="Model used for all AI coaching features">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as typeof model)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="claude-haiku-4-5-20251001">Haiku 4.5 (fast)</option>
          <option value="claude-sonnet-4-6">Sonnet 4.6 (balanced)</option>
          <option value="claude-opus-4-6">Opus 4.6 (powerful)</option>
        </select>
      </SettingsRow>
      <SaveRow onSave={() => onSave({ defaultModel: model })} isPending={isPending} saved={saved} />
    </div>
  );
}

function GoogleSettings({
  initial,
  onSave,
  isPending,
  saved,
}: {
  initial: NonNullable<SiteSettingsDoc["integrations"]>["google"];
  onSave: (cfg: Record<string, unknown>) => void;
  isPending: boolean;
  saved: boolean;
}) {
  const [allowNew, setAllowNew] = useState(initial?.allowNewRegistrations ?? true);
  const [domains, setDomains] = useState(initial?.allowedDomains ?? "");
  return (
    <div className="flex flex-col gap-3">
      <SettingsRow label="Allow new registrations" description="Permit new users to sign up via Google">
        <Toggle checked={allowNew} onChange={setAllowNew} />
      </SettingsRow>
      <SettingsRow label="Allowed domains" description="Comma-separated list; leave blank to allow all">
        <input
          type="text"
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          placeholder="e.g. example.com, company.org"
          className="w-52 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
        />
      </SettingsRow>
      <SaveRow onSave={() => onSave({ allowNewRegistrations: allowNew, allowedDomains: domains })} isPending={isPending} saved={saved} />
    </div>
  );
}

function UploadthingSettings({
  initial,
  onSave,
  isPending,
  saved,
}: {
  initial: NonNullable<SiteSettingsDoc["integrations"]>["uploadthing"];
  onSave: (cfg: Record<string, unknown>) => void;
  isPending: boolean;
  saved: boolean;
}) {
  const [maxSize, setMaxSize] = useState(initial?.maxFileSizeMb ?? 4);
  return (
    <div className="flex flex-col gap-3">
      <SettingsRow label="Max file size (MB)" description="Maximum size for profile image uploads">
        <input
          type="number"
          min={1}
          max={128}
          value={maxSize}
          onChange={(e) => setMaxSize(parseInt(e.target.value) || 4)}
          className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-right outline-none focus:ring-2 focus:ring-ring"
        />
      </SettingsRow>
      <SaveRow onSave={() => onSave({ maxFileSizeMb: maxSize })} isPending={isPending} saved={saved} />
    </div>
  );
}

function AppleHealthSettings({
  initial,
  onSave,
  isPending,
  saved,
}: {
  initial: NonNullable<SiteSettingsDoc["integrations"]>["appleHealth"];
  onSave: (cfg: Record<string, unknown>) => void;
  isPending: boolean;
  saved: boolean;
}) {
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [maxSize, setMaxSize] = useState(initial?.maxFileSizeMb ?? 50);
  const [dedupe, setDedupe] = useState(initial?.deduplicateByDate ?? true);
  return (
    <div className="flex flex-col gap-3">
      <SettingsRow label="Enable import" description="Allow users to import Apple Health XML exports">
        <Toggle checked={enabled} onChange={setEnabled} />
      </SettingsRow>
      <SettingsRow label="Max file size (MB)" description="Maximum size of uploaded export.xml file">
        <input
          type="number"
          min={1}
          max={500}
          value={maxSize}
          onChange={(e) => setMaxSize(parseInt(e.target.value) || 50)}
          className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-right outline-none focus:ring-2 focus:ring-ring"
        />
      </SettingsRow>
      <SettingsRow label="Deduplicate by date" description="Skip sessions that already exist within ±5 minutes">
        <Toggle checked={dedupe} onChange={setDedupe} />
      </SettingsRow>
      <SaveRow onSave={() => onSave({ enabled, maxFileSizeMb: maxSize, deduplicateByDate: dedupe })} isPending={isPending} saved={saved} />
    </div>
  );
}

function SaveRow({ onSave, isPending, saved }: { onSave: () => void; isPending: boolean; saved: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {saved && <p className="text-xs text-emerald-600 dark:text-emerald-400">Saved!</p>}
      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function IntegrationCard({
  integration,
  integrationSettings,
}: {
  integration: IntegrationDef;
  integrationSettings: SiteSettingsDoc["integrations"];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const { name, description, configured, docsUrl, settingsKey } = integration;
  const hasSettings = !!settingsKey;

  function handleSave(cfg: Record<string, unknown>) {
    if (!settingsKey) return;
    setSaved(false);
    startTransition(async () => {
      await updateIntegrationSettings(settingsKey, cfg);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4 p-5">
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
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`${name} docs`}
          >
            <ExternalLink className="size-3.5" />
          </a>
          {hasSettings && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Configure"
            >
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          )}
        </div>
      </div>

      {expanded && hasSettings && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {settingsKey === "anthropic" && (
            <AnthropicSettings
              initial={integrationSettings?.anthropic}
              onSave={handleSave}
              isPending={isPending}
              saved={saved}
            />
          )}
          {settingsKey === "google" && (
            <GoogleSettings
              initial={integrationSettings?.google}
              onSave={handleSave}
              isPending={isPending}
              saved={saved}
            />
          )}
          {settingsKey === "uploadthing" && (
            <UploadthingSettings
              initial={integrationSettings?.uploadthing}
              onSave={handleSave}
              isPending={isPending}
              saved={saved}
            />
          )}
          {settingsKey === "appleHealth" && (
            <AppleHealthSettings
              initial={integrationSettings?.appleHealth}
              onSave={handleSave}
              isPending={isPending}
              saved={saved}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function IntegrationsPanel({ integrations, settings }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.name}
          integration={integration}
          integrationSettings={settings}
        />
      ))}
    </div>
  );
}
