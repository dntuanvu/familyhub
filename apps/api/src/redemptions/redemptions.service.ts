import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedemptionStatus } from "@prisma/client";
import { computeBalanceForMember } from "../star-balance/compute";

/**
 * Rules ported from the former Postgres trigger:
 *   - reward must be active
 *   - stars_spent snapshots reward.star_cost
 *   - member must have >= star_cost balance (counting pending as spent)
 *   - max_per_week respected (counting non-rejected rows in family-local week)
 *   - decisions are terminal
 */
@Injectable()
export class RedemptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async request(args: {
    familyId: string;
    memberId: string;
    rewardId: string;
    requestingMemberId: string;
  }) {
    const reward = await this.prisma.reward.findUnique({ where: { id: args.rewardId } });
    if (!reward || reward.familyId !== args.familyId) {
      throw new NotFoundException("reward_not_found");
    }
    if (!reward.active) throw new BadRequestException("reward_inactive");

    const balance = await computeBalanceForMember(this.prisma, args.memberId);
    if (balance.balance < reward.starCost) throw new BadRequestException("insufficient_stars");

    if (reward.maxPerWeek !== null && reward.maxPerWeek !== undefined) {
      const family = await this.prisma.family.findUniqueOrThrow({ where: { id: args.familyId } });
      const weekStart = startOfIsoWeekInTz(new Date(), family.timezone);
      const used = await this.prisma.redemption.count({
        where: {
          rewardId: reward.id,
          memberId: args.memberId,
          status: { not: RedemptionStatus.rejected },
          requestedAt: { gte: weekStart },
        },
      });
      if (used >= reward.maxPerWeek) throw new BadRequestException("weekly_limit_reached");
    }

    return this.prisma.redemption.create({
      data: {
        familyId: args.familyId,
        rewardId: reward.id,
        memberId: args.memberId,
        starsSpent: reward.starCost,
        status: RedemptionStatus.pending,
      },
    });
  }

  async decide(args: {
    redemptionId: string;
    decidedBy: string;
    status: "approved" | "rejected";
  }) {
    const existing = await this.prisma.redemption.findUnique({ where: { id: args.redemptionId } });
    if (!existing) throw new NotFoundException();
    if (existing.status !== RedemptionStatus.pending) {
      throw new BadRequestException("redemption_already_decided");
    }
    return this.prisma.redemption.update({
      where: { id: args.redemptionId },
      data: {
        status: args.status === "approved" ? RedemptionStatus.approved : RedemptionStatus.rejected,
        decidedBy: args.decidedBy,
        decidedAt: new Date(),
      },
    });
  }
}

function startOfIsoWeekInTz(now: Date, timeZone: string): Date {
  // Compute the family's local Monday 00:00 as a UTC instant.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const weekdayMap: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  const dow = weekdayMap[parts.weekday ?? "Mon"] ?? 1;
  const localMidnight = `${parts.year}-${parts.month}-${parts.day}T00:00:00`;
  const localDate = new Date(localMidnight);
  localDate.setDate(localDate.getDate() - (dow - 1));
  // localDate is "the right wall-clock date" interpreted as UTC. Convert to the
  // actual instant that corresponds to midnight in the given timezone.
  const asUtcString = localDate.toISOString().slice(0, 19);
  // Figure out the offset between the given timezone and UTC at that wall time.
  const probe = new Date(asUtcString + "Z");
  const parts2 = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).formatToParts(probe).map((p) => [p.type, p.value]),
  );
  const tzLocal = Date.UTC(
    Number(parts2.year), Number(parts2.month) - 1, Number(parts2.day),
    Number(parts2.hour), Number(parts2.minute), Number(parts2.second),
  );
  const offsetMs = probe.getTime() - tzLocal;
  return new Date(probe.getTime() + offsetMs);
}
