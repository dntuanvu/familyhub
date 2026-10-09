import { ForbiddenException } from "@nestjs/common";
import type { AuthContext } from "./jwt.strategy";

export interface FamilyScope {
  familyId: string;
  memberId: string;
  role: "parent" | "child";
}

/**
 * Resolve which family the caller is acting in.
 * - If familyId is provided (query/body/param), the caller must be a member.
 * - Otherwise, if the caller belongs to exactly one family, use it.
 * - Otherwise, reject so the caller passes an explicit familyId.
 */
export function resolveFamilyScope(user: AuthContext, familyId?: string): FamilyScope {
  if (familyId) {
    const m = user.memberships.find((x) => x.familyId === familyId);
    if (!m) throw new ForbiddenException("Not a member of this family");
    return { familyId: m.familyId, memberId: m.memberId, role: m.role };
  }
  if (user.memberships.length === 1) {
    const m = user.memberships[0]!;
    return { familyId: m.familyId, memberId: m.memberId, role: m.role };
  }
  throw new ForbiddenException("familyId required");
}

export function requireParent(scope: FamilyScope): FamilyScope {
  if (scope.role !== "parent") throw new ForbiddenException("Parent role required");
  return scope;
}
