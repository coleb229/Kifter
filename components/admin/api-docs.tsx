"use client";

import { useState } from "react";
import { API_DOCS } from "@/data/api-docs";

export function ApiDocs() {
  const [activeId, setActiveId] = useState(API_DOCS[0].id);
  const domain = API_DOCS.find((d) => d.id === activeId) ?? API_DOCS[0];

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <nav className="hidden w-40 shrink-0 flex-col gap-1 md:flex">
        {API_DOCS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setActiveId(d.id)}
            className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
              activeId === d.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {d.label}
          </button>
        ))}
      </nav>

      {/* Mobile tab row */}
      <div className="flex w-full flex-col gap-4 md:hidden">
        <div className="flex flex-wrap gap-2">
          {API_DOCS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveId(d.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeId === d.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted text-muted-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <h3 className="text-lg font-semibold">{domain.label}</h3>
        {domain.actions.map((action) => (
          <div
            key={action.name}
            id={`${domain.id}-${action.name}`}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono font-semibold">
                {action.name}()
              </code>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </div>

            {action.params && action.params.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Parameters</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Name</th>
                        <th className="px-3 py-2 text-left font-medium">Type</th>
                        <th className="px-3 py-2 text-left font-medium">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {action.params.map((p) => (
                        <tr key={p.name} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-mono">{p.name}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{p.type}</td>
                          <td className="px-3 py-2">{p.required ? "✓" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Returns:</span>{" "}
              <code className="font-mono">{action.returns}</code>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
