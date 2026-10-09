import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthContext } from "../auth/jwt.strategy";
import { resolveFamilyScope } from "../auth/family-scope";
import { PrismaService } from "../prisma/prisma.service";
import { computeBalanceForMember, computeBalancesForFamily } from "./compute";

@ApiTags("star-balance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("star-balance")
export class StarBalanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthContext, @Query("familyId") familyId?: string) {
    const scope = resolveFamilyScope(user, familyId);
    return computeBalancesForFamily(this.prisma, scope.familyId);
  }

  @Get(":memberId")
  async get(@CurrentUser() user: AuthContext, @Param("memberId") memberId: string) {
    const member = await this.prisma.member.findUniqueOrThrow({ where: { id: memberId } });
    resolveFamilyScope(user, member.familyId);
    return computeBalanceForMember(this.prisma, memberId);
  }
}
