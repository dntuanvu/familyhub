import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthContext } from "../auth/jwt.strategy";
import { requireParent, resolveFamilyScope } from "../auth/family-scope";
import { PrismaService } from "../prisma/prisma.service";

class CreateAdjustmentDto {
  @IsUUID() memberId!: string;
  @IsInt() delta!: number;
  @IsOptional() @IsString() reason?: string;
}

@ApiTags("star-adjustments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("star-adjustments")
export class StarAdjustmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId?: string,
    @Query("memberId") memberId?: string,
  ) {
    const scope = resolveFamilyScope(user, familyId);
    return this.prisma.starAdjustment.findMany({
      where: { familyId: scope.familyId, ...(memberId ? { memberId } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post()
  create(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId: string | undefined,
    @Body() dto: CreateAdjustmentDto,
  ) {
    if (dto.delta === 0) throw new BadRequestException("delta must not be zero");
    const scope = requireParent(resolveFamilyScope(user, familyId));
    return this.prisma.starAdjustment.create({
      data: {
        familyId: scope.familyId,
        memberId: dto.memberId,
        delta: dto.delta,
        reason: dto.reason ?? "",
        createdBy: scope.memberId,
      },
    });
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    const existing = await this.prisma.starAdjustment.findUniqueOrThrow({ where: { id } });
    requireParent(resolveFamilyScope(user, existing.familyId));
    await this.prisma.starAdjustment.delete({ where: { id } });
    return { ok: true };
  }
}
