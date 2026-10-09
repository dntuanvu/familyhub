import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthContext } from "../auth/jwt.strategy";
import { requireParent, resolveFamilyScope } from "../auth/family-scope";
import { PrismaService } from "../prisma/prisma.service";

class UpdateFamilyDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() timezone?: string;
}

@ApiTags("families")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("families")
export class FamiliesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthContext) {
    const ids = user.memberships.map((m) => m.familyId);
    return this.prisma.family.findMany({ where: { id: { in: ids } } });
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    resolveFamilyScope(user, id);
    return this.prisma.family.findUniqueOrThrow({ where: { id } });
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthContext,
    @Param("id") id: string,
    @Body() dto: UpdateFamilyDto,
  ) {
    requireParent(resolveFamilyScope(user, id));
    return this.prisma.family.update({ where: { id }, data: dto });
  }
}
