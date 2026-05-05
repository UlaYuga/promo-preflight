import { Suspense } from "react";
import { IntakeForm } from "@/components/intake-form";

export default function IntakePage() {
  return (
    <Suspense>
      <IntakeForm />
    </Suspense>
  );
}
