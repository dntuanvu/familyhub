import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsPositive, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthContext } from "../auth/jwt.strategy";
import { requireParent, resolveFamilyScope } from "../auth/family-scope";
import { PrismaService } from "../prisma/prisma.service";

class CreateRewardDto {
  @IsString() @MinLength(1) title!: string;
  @IsOptional() @IsString() icon?: string;
  @IsInt() @IsPositive() starCost!: number;
  @IsOptional() @IsInt() @IsPositive() maxPerWeek?: number | null;
  @IsOptional() @IsInt() sortOrder?: number;
}

class UpdateRewardDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsInt() @IsPositive() starCost?: number;
  @IsOptional() @IsInt() @IsPositive() maxPerWeek?: number | null;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

@ApiTags("rewards")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("rewards")
export class RewardsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthContext, @Query("familyId") familyId?: string) {
    const scope = resolveFamilyScope(user, familyId);
    return this.prisma.reward.findMany({
      where: { familyId: scope.familyId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  @Post()
  create(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId: string | undefined,
    @Body() dto: CreateRewardDto,
  ) {
    const scope = requireParent(resolveFamilyScope(user, familyId));
    return this.prisma.reward.create({
      data: {
        familyId: scope.familyId,
        title: dto.title,
        icon: dto.icon ?? "🎁",
        starCost: dto.starCost,
        maxPerWeek: dto.maxPerWeek ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthContext,
    @Param("id") id: string,
    @Body() dto: UpdateRewardDto,
  ) {
    const existing = await this.prisma.reward.findUniqueOrThrow({ where: { id } });
    requireParent(resolveFamilyScope(user, existing.familyId));
    return this.prisma.reward.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    const existing = await this.prisma.reward.findUniqueOrThrow({ where: { id } });
    requireParent(resolveFamilyScope(user, existing.familyId));
    await this.prisma.reward.delete({ where: { id } });
    return { ok: true };
  }
}
