import { Suspense } from "react";
import { IntakeForm } from "@/components/intake-form";

export const dynamic = "force-dynamic";

export default function IntakePage() {
  return (
    <Suspense>
      <IntakeForm />
    </Suspense>
  );
}
