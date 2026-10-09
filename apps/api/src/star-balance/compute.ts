import { PrismaClient, RedemptionStatus } from "@prisma/client";

export interface Balance {
  memberId: string;
  familyId: string;
  earned: number;
  adjusted: number;
  spent: number;
  balance: number;
}

/**
 * Reconstruction of the former `member_star_balance` view.
 * Pending redemptions count as spent; rejected ones are refunded.
 */
export async function computeBalanceForMember(
  prisma: PrismaClient,
  memberId: string,
): Promise<Balance> {
  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });

  const [earnedAgg, adjustedAgg, spentAgg] = await Promise.all([
    prisma.taskCompletion.aggregate({
      _sum: { starsAwarded: true },
      where: { memberId },
    }),
    prisma.starAdjustment.aggregate({
      _sum: { delta: true },
      where: { memberId },
    }),
    prisma.redemption.aggregate({
      _sum: { starsSpent: true },
      where: { memberId, status: { not: RedemptionStatus.rejected } },
    }),
  ]);

  const earned = earnedAgg._sum.starsAwarded ?? 0;
  const adjusted = adjustedAgg._sum.delta ?? 0;
  const spent = spentAgg._sum.starsSpent ?? 0;
  return {
    memberId,
    familyId: member.familyId,
    earned,
    adjusted,
    spent,
    balance: earned + adjusted - spent,
  };
}

export async function computeBalancesForFamily(
  prisma: PrismaClient,
  familyId: string,
): Promise<Balance[]> {
  const members = await prisma.member.findMany({ where: { familyId } });
  return Promise.all(members.map((m) => computeBalanceForMember(prisma, m.id)));
}
