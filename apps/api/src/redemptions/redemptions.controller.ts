import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthContext } from "../auth/jwt.strategy";
import { requireParent, resolveFamilyScope } from "../auth/family-scope";
import { PrismaService } from "../prisma/prisma.service";
import { RedemptionsService } from "./redemptions.service";
import { RedemptionStatus } from "@prisma/client";

class CreateRedemptionDto {
  @IsUUID() rewardId!: string;
  @IsUUID() memberId!: string;
}

class DecideRedemptionDto {
  @IsEnum(["approved", "rejected"] as const)
  status!: "approved" | "rejected";
}

@ApiTags("redemptions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("redemptions")
export class RedemptionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly service: RedemptionsService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId?: string,
    @Query("status") status?: RedemptionStatus,
    @Query("memberId") memberId?: string,
  ) {
    const scope = resolveFamilyScope(user, familyId);
    return this.prisma.redemption.findMany({
      where: {
        familyId: scope.familyId,
        ...(status ? { status } : {}),
        ...(memberId ? { memberId } : {}),
      },
      orderBy: { requestedAt: "desc" },
    });
  }

  @Post()
  create(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId: string | undefined,
    @Body() dto: CreateRedemptionDto,
  ) {
    const scope = resolveFamilyScope(user, familyId);
    return this.service.request({
      familyId: scope.familyId,
      memberId: dto.memberId,
      rewardId: dto.rewardId,
      requestingMemberId: scope.memberId,
    });
  }

  @Patch(":id")
  async decide(
    @CurrentUser() user: AuthContext,
    @Param("id") id: string,
    @Body() dto: DecideRedemptionDto,
  ) {
    const existing = await this.prisma.redemption.findUniqueOrThrow({ where: { id } });
    const scope = requireParent(resolveFamilyScope(user, existing.familyId));
    return this.service.decide({
      redemptionId: id,
      decidedBy: scope.memberId,
      status: dto.status,
    });
  }
}
