import { redirect } from "next/navigation";

export default async function LegacyRunLinkPage({
  params
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  redirect(`/app/runs/${encodeURIComponent(id)}`);
}
