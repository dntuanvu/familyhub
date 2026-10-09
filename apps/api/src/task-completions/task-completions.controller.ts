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
import { IsDateString, IsOptional, IsUUID } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthContext } from "../auth/jwt.strategy";
import { resolveFamilyScope } from "../auth/family-scope";
import { PrismaService } from "../prisma/prisma.service";

class CreateCompletionDto {
  @IsUUID() taskId!: string;
  @IsUUID() memberId!: string;
  @IsDateString() completedOn!: string;
  @IsOptional() @IsUUID() completedBy?: string;
}

@ApiTags("task-completions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("task-completions")
export class TaskCompletionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId?: string,
    @Query("memberId") memberId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const scope = resolveFamilyScope(user, familyId);
    return this.prisma.taskCompletion.findMany({
      where: {
        familyId: scope.familyId,
        ...(memberId ? { memberId } : {}),
        ...(from || to
          ? {
              completedOn: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { completedOn: "desc" },
    });
  }

  @Post()
  async create(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId: string | undefined,
    @Body() dto: CreateCompletionDto,
  ) {
    const scope = resolveFamilyScope(user, familyId);
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id: dto.taskId } });
    if (task.familyId !== scope.familyId) throw new BadRequestException("Task not in family");
    const member = await this.prisma.member.findUniqueOrThrow({ where: { id: dto.memberId } });
    if (member.familyId !== scope.familyId) throw new BadRequestException("Member not in family");

    // Snapshot stars at completion time (replaces the SQL trigger).
    return this.prisma.taskCompletion.create({
      data: {
        familyId: scope.familyId,
        taskId: dto.taskId,
        memberId: dto.memberId,
        completedOn: new Date(dto.completedOn),
        completedBy: dto.completedBy ?? scope.memberId,
        starsAwarded: task.stars,
      },
    });
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    const existing = await this.prisma.taskCompletion.findUniqueOrThrow({ where: { id } });
    resolveFamilyScope(user, existing.familyId);
    await this.prisma.taskCompletion.delete({ where: { id } });
    return { ok: true };
  }
}
