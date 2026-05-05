import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export function EmptyState({
  title,
  description
}: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center px-6 py-8 text-center">
      <Inbox className="h-5 w-5 text-muted" aria-hidden="true" />
      <h3 className="mt-3 text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-subtle">{description}</p>
    </div>
  );
}

export function LoadingState({ label }: Readonly<{ label: string }>) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-subtle">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({
  title,
  description
}: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <div className="rounded-lg border border-fail/20 bg-fail/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 font-medium text-fail">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {title}
      </div>
      <p className="mt-1 leading-6 text-foreground/70">{description}</p>
    </div>
  );
}
