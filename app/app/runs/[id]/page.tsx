import { notFound } from "next/navigation";
import type { Run } from "@/domain/model/Run";
import { getDb } from "@/infrastructure/db/client";
import { RunRepository } from "@/infrastructure/persistence/RunRepository";
import { RunDetailView } from "./RunDetailView";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RunPageParams = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function RunDetailPage({ params }: RunPageParams) {
  const { id } = await params;
  const run = await loadRun(id);

  if (!run) {
    notFound();
  }

  return <RunDetailView run={JSON.parse(JSON.stringify(run))} />;
}

async function loadRun(id: string): Promise<Run | null> {
  const db = getDb();
  const repository = new RunRepository(db);
  return repository.findById(id);
}
