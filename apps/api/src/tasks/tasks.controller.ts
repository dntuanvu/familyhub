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
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthContext } from "../auth/jwt.strategy";
import { resolveFamilyScope } from "../auth/family-scope";
import { PrismaService } from "../prisma/prisma.service";
import { TimeOfDay } from "@prisma/client";

class CreateTaskDto {
  @IsString() @MinLength(1) title!: string;
  @IsOptional() @IsString() icon?: string;
  @IsEnum(TimeOfDay) timeOfDay!: TimeOfDay;
  @IsOptional() @IsInt() @Min(0) stars?: number;
  @IsOptional() @IsUUID() assigneeId?: string | null;
  @IsOptional() @IsArray() @ArrayUnique() @IsInt({ each: true }) @Min(1, { each: true }) @Max(7, { each: true })
  recurrenceDays?: number[];
  @IsDateString() startDate!: string;
  @IsOptional() @IsDateString() endDate?: string | null;
  @IsOptional() @IsInt() sortOrder?: number;
}

class UpdateTaskDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsEnum(TimeOfDay) timeOfDay?: TimeOfDay;
  @IsOptional() @IsInt() @Min(0) stars?: number;
  @IsOptional() @IsUUID() assigneeId?: string | null;
  @IsOptional() @IsArray() @ArrayUnique() @IsInt({ each: true }) @Min(1, { each: true }) @Max(7, { each: true })
  recurrenceDays?: number[];
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string | null;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

@ApiTags("tasks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("tasks")
export class TasksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId?: string,
    @Query("active") active?: string,
  ) {
    const scope = resolveFamilyScope(user, familyId);
    return this.prisma.task.findMany({
      where: {
        familyId: scope.familyId,
        ...(active === undefined ? {} : { active: active === "true" }),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id } });
    resolveFamilyScope(user, task.familyId);
    return task;
  }

  @Post()
  create(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId: string | undefined,
    @Body() dto: CreateTaskDto,
  ) {
    const scope = resolveFamilyScope(user, familyId);
    return this.prisma.task.create({
      data: {
        familyId: scope.familyId,
        title: dto.title,
        icon: dto.icon ?? "✅",
        timeOfDay: dto.timeOfDay,
        stars: dto.stars ?? 1,
        assigneeId: dto.assigneeId ?? null,
        recurrenceDays: dto.recurrenceDays ?? [],
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthContext,
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const existing = await this.prisma.task.findUniqueOrThrow({ where: { id } });
    resolveFamilyScope(user, existing.familyId);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    const existing = await this.prisma.task.findUniqueOrThrow({ where: { id } });
    resolveFamilyScope(user, existing.familyId);
    await this.prisma.task.delete({ where: { id } });
    return { ok: true };
  }
}
