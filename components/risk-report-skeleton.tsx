import { EmptyState } from "@/components/ui-states";

const checkNames = [
  "Channel consistency",
  "Terms robustness",
  "Offer math sanity",
  "Jurisdictional risk signals",
  "Localization QA",
  "Launch ownership",
  "Link QA",
  "Format QA"
];

export function RiskReportSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase text-muted">
          Risk Report
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">
          Structured check results
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-subtle">
          Empty report surfaces for summary status, checks, issues, and issue
          detail review.
        </p>
      </div>

      <RiskSummaryBar />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {checkNames.map((name) => (
          <CheckStatusCard key={name} name={name} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded border border-white/[0.07] bg-surface/60">
          <div className="border-b border-white/[0.07] px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Issue table</h3>
          </div>
          <div className="grid grid-cols-[1fr_110px_120px] gap-3 border-b border-white/[0.07] px-4 py-3 text-xs font-medium uppercase text-muted">
            <span>Detected issue</span>
            <span>Owner</span>
            <span>Blocker</span>
          </div>
          <IssueRow />
          <IssueRow />
          <IssueRow />
        </div>

        <IssueDetailDrawer />
      </section>
    </div>
  );
}

export function RiskSummaryBar() {
  const summaryItems = [
    "Overall status",
    "Pass / warn / fail",
    "Critical blockers",
    "Generated timestamp"
  ];

  return (
    <section className="grid gap-3 rounded border border-white/[0.07] bg-surface/60 p-4 md:grid-cols-4">
      {summaryItems.map((item) => (
        <div key={item} className="rounded border border-white/[0.07] bg-background p-3">
          <p className="text-xs font-medium uppercase text-muted">{item}</p>
          <div className="mt-3 h-6 rounded bg-overlay" />
        </div>
      ))}
    </section>
  );
}

export function CheckStatusCard({ name }: Readonly<{ name: string }>) {
  return (
    <article className="rounded border border-white/[0.07] bg-surface/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{name}</h3>
        <span className="rounded border border-white/[0.07] px-2 py-1 text-xs text-muted">
          Pending
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 rounded bg-overlay" />
        <div className="h-2 w-2/3 rounded bg-overlay" />
      </div>
      <p className="mt-4 text-xs text-muted">Issues and confidence pending.</p>
    </article>
  );
}

export function IssueRow() {
  return (
    <div className="grid grid-cols-[1fr_110px_120px] gap-3 border-b border-white/[0.07] px-4 py-4 last:border-b-0">
      <div className="space-y-2">
        <div className="h-3 rounded bg-overlay" />
        <div className="h-3 w-2/3 rounded bg-overlay" />
      </div>
      <div className="h-6 rounded bg-overlay" />
      <div className="h-6 rounded bg-overlay" />
    </div>
  );
}

export function IssueDetailDrawer() {
  return (
    <aside className="rounded border border-white/[0.07] bg-surface/60 p-4">
      <h3 className="text-sm font-semibold text-foreground">Issue detail</h3>
      <div className="mt-4">
        <EmptyState
          title="No issue selected"
          description="Issue explanation, affected source fields, suggested fix, and owner assignment will appear here."
        />
      </div>
    </aside>
  );
}

export function FixSuggestionCard() {
  return (
    <div className="rounded border border-white/[0.07] bg-background p-3 text-sm text-subtle">
      Suggested fix placeholder
    </div>
  );
}

export function ExportPanel() {
  return (
    <div className="rounded border border-white/[0.07] bg-surface/60 p-4 text-sm text-muted">
      Export actions are reserved for a later task.
    </div>
  );
}
