import {
  OWNER_ROLES,
  OwnerOverridesSchema,
  type OwnerOverrides,
  type OwnerResolution
} from "../../schemas/owners";
import type { OwnerRole } from "../../schemas/index";

export function sanitizeOwnerOverrides(value: unknown): OwnerOverrides {
  const parsed = OwnerOverridesSchema.safeParse(value);

  if (!parsed.success) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed.data).filter(([, name]) => Boolean(name?.trim()))
  ) as OwnerOverrides;
}

export function resolveOwner({
  ownerRole,
  ownerOverrides,
  workspaceOwners
}: Readonly<{
  ownerRole: OwnerRole;
  ownerOverrides?: OwnerOverrides;
  workspaceOwners: OwnerOverrides;
}>): OwnerResolution {
  const overrideName = ownerOverrides?.[ownerRole]?.trim();
  const workspaceName = workspaceOwners[ownerRole]?.trim();
  const ownerName = overrideName || workspaceName;

  return {
    ownerRole,
    ownerName: ownerName || `${ownerRole} (not assigned)`,
    assigned: Boolean(ownerName)
  };
}

export function resolveAllOwners({
  ownerOverrides,
  workspaceOwners
}: Readonly<{
  ownerOverrides?: OwnerOverrides;
  workspaceOwners: OwnerOverrides;
}>): OwnerResolution[] {
  return OWNER_ROLES.map((ownerRole) =>
    resolveOwner({ ownerRole, ownerOverrides, workspaceOwners })
  );
}

export function ownerResolutionsToReadinessOwners(
  resolutions: OwnerResolution[]
) {
  return resolutions.map((owner) => ({
    role: owner.ownerRole,
    name: owner.ownerName,
    status: owner.assigned ? "approved" : "pending"
  }));
}

export function formatOwnerRoleLabel(ownerRole: OwnerRole) {
  if (ownerRole === "product") {
    return "Project / Delivery";
  }

  if (ownerRole === "crm") {
    return "CRM";
  }

  return ownerRole.charAt(0).toUpperCase() + ownerRole.slice(1);
}
