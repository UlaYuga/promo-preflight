import { EmptyState } from "@/components/ui-states";

const intakeSections = [
  {
    title: "Campaign Metadata",
    fields: [
      "Campaign name",
      "Campaign category",
      "GEO / jurisdiction",
      "Language / locale",
      "Currency",
      "Launch date",
      "Channels included"
    ]
  },
  {
    title: "Offer Basics",
    fields: [
      "Minimum entry",
      "Reward amount / percentage",
      "Maximum reward",
      "Usage requirement",
      "Maximum return",
      "Eligibility rules"
    ]
  },
  {
    title: "Assets",
    fields: [
      "Terms text",
      "Email subject",
      "Email body",
      "Push title",
      "Push body",
      "Onsite banner copy",
      "Landing page hero / CTA"
    ]
  },
  {
    title: "Links",
    fields: ["CTA URL", "Landing URL", "Deep link", "UTM parameters"]
  },
  {
    title: "Owners",
    fields: [
      "Product owner",
      "CRM owner",
      "Legal owner",
      "Risk owner",
      "Localization owner",
      "Analytics owner"
    ]
  },
  {
    title: "Notes",
    fields: ["Internal launch notes"]
  }
];

export function IntakeSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase text-muted">
            Intake
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            Campaign bundle
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-subtle">
            Placeholder intake structure for collecting campaign context before
            checks are implemented.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {intakeSections.map((section) => (
            <IntakeSectionCard
              key={section.title}
              title={section.title}
              fields={section.fields}
            />
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <EmptyState
          title="No draft saved"
          description="Draft persistence and validation arrive in a later task."
        />
        <div className="rounded border border-white/[0.07] bg-surface/60 p-4">
          <h3 className="text-sm font-semibold text-foreground/80">Run Preflight</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            The action is intentionally disabled while this screen is a
            route-level UX skeleton.
          </p>
          <button
            type="button"
            disabled
            className="mt-4 w-full rounded border border-white/[0.07] bg-background px-4 py-3 text-sm font-medium text-muted/60"
          >
            Run Preflight
          </button>
        </div>
      </aside>
    </div>
  );
}

export function IntakeSectionCard({
  title,
  fields
}: Readonly<{
  title: string;
  fields: string[];
}>) {
  return (
    <article className="rounded border border-white/[0.07] bg-surface/60 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-4 space-y-3">
        {fields.map((field) => (
          <div key={field}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-subtle">{field}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
            </div>
            <div className="h-9 rounded border border-white/[0.07] bg-background" />
          </div>
        ))}
      </div>
    </article>
  );
}

export function AssetTextarea({ label }: Readonly<{ label: string }>) {
  return (
    <div>
      <label className="text-xs font-medium text-subtle">{label}</label>
      <div className="mt-1 h-28 rounded border border-white/[0.07] bg-background" />
    </div>
  );
}
