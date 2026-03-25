"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Upload, CheckCircle, AlertCircle, Apple } from "lucide-react";
import { exportWorkoutsCSV, exportDietCSV } from "@/actions/export-actions";
import { importWorkoutsCSV, importDietCSV, importAppleHealthParsed } from "@/actions/import-actions";
import { parseAppleHealthFile } from "@/lib/apple-health-client-parser";

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Section({
  title,
  description,
  onExport,
  onImport,
  exportLabel,
  importLabel,
  isPending,
  message,
}: {
  title: string;
  description: string;
  onExport: () => void;
  onImport: (file: File) => void;
  exportLabel: string;
  importLabel: string;
  isPending: boolean;
  message: { type: "success" | "error"; text: string } | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onExport}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50 transition-all"
        >
          <Download className="size-3.5" />
          {exportLabel}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
        >
          <Upload className="size-3.5" />
          {importLabel}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { onImport(file); e.target.value = ""; }
          }}
        />
      </div>
      {message && (
        <div className={`flex items-center gap-1.5 text-sm ${message.type === "success" ? "text-emerald-600" : "text-destructive"}`}>
          {message.type === "success" ? <CheckCircle className="size-4" /> : <AlertCircle className="size-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}

export default function DataPage() {
  const [isPendingW, startW] = useTransition();
  const [isPendingD, startD] = useTransition();
  const [isPendingAH, startAH] = useTransition();
  const [msgW, setMsgW] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [msgD, setMsgD] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [msgAH, setMsgAH] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const ahFileRef = useRef<HTMLInputElement>(null);
  function handleExportWorkouts() {
    startW(async () => {
      const result = await exportWorkoutsCSV();
      if (result.success) {
        downloadCsv(result.data, `workouts-${new Date().toISOString().slice(0, 10)}.csv`);
        setMsgW({ type: "success", text: "Export downloaded." });
      } else {
        setMsgW({ type: "error", text: result.error });
      }
    });
  }

  function handleImportWorkouts(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      startW(async () => {
        const result = await importWorkoutsCSV(text);
        if (result.success) {
          setMsgW({ type: "success", text: `Imported ${result.data.imported} session${result.data.imported !== 1 ? "s" : ""}.` });
        } else {
          setMsgW({ type: "error", text: result.error });
        }
      });
    };
    reader.readAsText(file);
  }

  function handleExportDiet() {
    startD(async () => {
      const result = await exportDietCSV();
      if (result.success) {
        downloadCsv(result.data, `diet-${new Date().toISOString().slice(0, 10)}.csv`);
        setMsgD({ type: "success", text: "Export downloaded." });
      } else {
        setMsgD({ type: "error", text: result.error });
      }
    });
  }

  function handleImportDiet(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      startD(async () => {
        const result = await importDietCSV(text);
        if (result.success) {
          setMsgD({ type: "success", text: `Imported ${result.data.imported} entr${result.data.imported !== 1 ? "ies" : "y"}.` });
        } else {
          setMsgD({ type: "error", text: result.error });
        }
      });
    };
    reader.readAsText(file);
  }

  async function handleImportAppleHealth(file: File) {
    setMsgAH(null);
    let parsed: { workouts: import("@/types").ParsedAppleHealthWorkout[]; bodyRecords: import("@/types").ParsedAppleHealthBodyRecord[] };
    try {
      parsed = await parseAppleHealthFile(file);
    } catch (e) {
      setMsgAH({ type: "error", text: e instanceof Error ? e.message : "Failed to parse file." });
      return;
    }
    startAH(async () => {
      const result = await importAppleHealthParsed(parsed.workouts, parsed.bodyRecords);
      if (result.success) {
        const { cardio, training, bodyWeight, skipped } = result.data;
        setMsgAH({ type: "success", text: buildImportMsg(cardio, training, bodyWeight, skipped) });
      } else {
        setMsgAH({ type: "error", text: result.error });
      }
    });
  }

  function buildImportMsg(cardio: number, training: number, bodyWeight: number, skipped: number): string {
    const parts: string[] = [];
    if (cardio > 0) parts.push(`${cardio} cardio session${cardio !== 1 ? "s" : ""} imported`);
    if (training > 0) parts.push(`${training} training session${training !== 1 ? "s" : ""} enriched with Apple Health data`);
    if (bodyWeight > 0) parts.push(`${bodyWeight} body weight record${bodyWeight !== 1 ? "s" : ""} imported`);
    const base = parts.length > 0 ? parts.join(", ") + "." : "No matching sessions found.";
    return skipped > 0 ? `${base} ${skipped} cardio skipped as duplicate${skipped !== 1 ? "s" : ""}.` : base;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up">
        <h1 className="text-xl font-bold tracking-tight">Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">Export your history or import from a CSV file.</p>
      </div>
      <div className="flex flex-col gap-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <Section
          title="Workouts"
          description="Columns: date, sessionName, bodyTarget, exercise, setNumber, weight, weightUnit, reps"
          onExport={handleExportWorkouts}
          onImport={handleImportWorkouts}
          exportLabel="Export CSV"
          importLabel="Import CSV"
          isPending={isPendingW}
          message={msgW}
        />
        <Section
          title="Diet"
          description="Columns: date, mealType, food, calories, protein, carbs, fat, notes"
          onExport={handleExportDiet}
          onImport={handleImportDiet}
          exportLabel="Export CSV"
          importLabel="Import CSV"
          isPending={isPendingD}
          message={msgD}
        />

        {/* Apple Health Import */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40">
              <Apple className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="font-semibold">Apple Health</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Import cardio sessions and enrich existing training sessions with Apple Health data.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                On iPhone: <span className="font-medium">Health app → profile icon → Export All Health Data</span> → upload the <span className="font-mono text-xs">.zip</span> directly, or unzip and upload <span className="font-mono text-xs">export.xml</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => ahFileRef.current?.click()}
              disabled={isPendingAH}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <Upload className="size-3.5" />
              {isPendingAH ? "Importing…" : "Import .zip or export.xml"}
            </button>
            <input
              ref={ahFileRef}
              type="file"
              accept=".zip,.xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { handleImportAppleHealth(file); e.target.value = ""; }
              }}
            />
          </div>

          {msgAH && (
            <div className={`flex items-center gap-1.5 text-sm ${msgAH.type === "success" ? "text-emerald-600" : "text-destructive"}`}>
              {msgAH.type === "success" ? <CheckCircle className="size-4" /> : <AlertCircle className="size-4" />}
              {msgAH.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
