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
import { IsEnum, IsHexColor, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthContext } from "../auth/jwt.strategy";
import { requireParent, resolveFamilyScope } from "../auth/family-scope";
import { PrismaService } from "../prisma/prisma.service";
import { MemberRole } from "@prisma/client";

class CreateMemberDto {
  @IsString() @MinLength(1) name!: string;
  @IsEnum(MemberRole) role!: MemberRole;
  @IsOptional() @IsString() avatarEmoji?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsUUID() userId?: string;
}

class UpdateMemberDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() avatarEmoji?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsEnum(MemberRole) role?: MemberRole;
}

@ApiTags("members")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("members")
export class MembersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthContext, @Query("familyId") familyId?: string) {
    const scope = resolveFamilyScope(user, familyId);
    return this.prisma.member.findMany({
      where: { familyId: scope.familyId },
      orderBy: { createdAt: "asc" },
    });
  }

  @Post()
  create(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId: string | undefined,
    @Body() dto: CreateMemberDto,
  ) {
    const scope = requireParent(resolveFamilyScope(user, familyId));
    return this.prisma.member.create({
      data: { ...dto, familyId: scope.familyId },
    });
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthContext,
    @Param("id") id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    const existing = await this.prisma.member.findUniqueOrThrow({ where: { id } });
    requireParent(resolveFamilyScope(user, existing.familyId));
    return this.prisma.member.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    const existing = await this.prisma.member.findUniqueOrThrow({ where: { id } });
    requireParent(resolveFamilyScope(user, existing.familyId));
    await this.prisma.member.delete({ where: { id } });
    return { ok: true };
  }
}
