import { EmptyState } from "@/components/ui-states";

const ownerRoles = [
  "Product",
  "CRM",
  "Legal",
  "Risk",
  "Localization",
  "Analytics"
];

const checklistItems = [
  "Legal reviewed",
  "Risk reviewed",
  "Localization reviewed",
  "CRM assets aligned",
  "Landing page aligned",
  "Links tested",
  "Analytics / UTM checked",
  "Promo terms finalized"
];

export function ReadinessSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase text-muted">
          Launch Readiness
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">
          Owners, blockers, dependencies
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-subtle">
          Empty readiness surfaces for go/no-go status, owner matrix, blockers,
          dependencies, and launch checklist.
        </p>
      </div>

      <GoNoGoBanner />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ReadinessMatrix />

        <section className="space-y-4">
          <div className="rounded border border-white/[0.07] bg-surface/60 p-4">
            <h3 className="text-sm font-semibold text-foreground">Blockers</h3>
            <div className="mt-4">
              <EmptyState
                title="No blockers generated"
                description="Blocker title, source check, severity, owner, action, status, and due date will appear here."
              />
            </div>
          </div>

          <div className="rounded border border-white/[0.07] bg-surface/60 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Launch checklist
            </h3>
            <div className="mt-4 space-y-2">
              {checklistItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded border border-white/[0.07] bg-background px-3 py-2 text-sm text-subtle"
                >
                  <span>{item}</span>
                  <span className="h-4 w-4 rounded border border-white/[0.07]" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="rounded border border-white/[0.07] bg-surface/60 p-4">
        <h3 className="text-sm font-semibold text-foreground">Dependencies</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <DependencyRow />
          <DependencyRow />
        </div>
      </div>
    </div>
  );
}

export function GoNoGoBanner() {
  return (
    <section className="rounded border border-white/[0.07] bg-surface/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted">
            Go / No-Go
          </p>
          <h3 className="mt-1 text-xl font-semibold text-foreground">
            Awaiting report
          </h3>
        </div>
        <span className="rounded border border-white/[0.07] bg-background px-3 py-2 text-sm font-medium text-muted">
          Needs review
        </span>
      </div>
    </section>
  );
}

export function ReadinessMatrix() {
  return (
    <section className="rounded border border-white/[0.07] bg-surface/60">
      <div className="border-b border-white/[0.07] px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Owner matrix</h3>
      </div>
      <div className="grid grid-cols-[1fr_120px_120px] gap-3 border-b border-white/[0.07] px-4 py-3 text-xs font-medium uppercase text-muted">
        <span>Role</span>
        <span>Status</span>
        <span>Due date</span>
      </div>
      {ownerRoles.map((role) => (
        <OwnerStatusRow key={role} role={role} />
      ))}
    </section>
  );
}

export function OwnerStatusRow({ role }: Readonly<{ role: string }>) {
  return (
    <div className="grid grid-cols-[1fr_120px_120px] gap-3 border-b border-white/[0.07] px-4 py-4 text-sm last:border-b-0">
      <span className="text-foreground/70">{role}</span>
      <span className="rounded border border-white/[0.07] bg-background px-2 py-1 text-xs text-muted">
        Pending
      </span>
      <span className="h-6 rounded bg-overlay" />
    </div>
  );
}

export function DependencyRow() {
  return (
    <div className="rounded border border-white/[0.07] bg-background p-3">
      <div className="h-3 rounded bg-overlay" />
      <div className="mt-3 h-3 w-2/3 rounded bg-overlay" />
      <div className="mt-4 h-7 rounded border border-white/[0.07] bg-surface" />
    </div>
  );
}
