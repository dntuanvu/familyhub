import {
  BadRequestException,
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
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthContext } from "../auth/jwt.strategy";
import { resolveFamilyScope } from "../auth/family-scope";
import { PrismaService } from "../prisma/prisma.service";

class CreateEventDto {
  @IsString() @MinLength(1) title!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsBoolean() allDay?: boolean;
  @IsOptional() @IsString() location?: string | null;
  @IsOptional() @IsString() notes?: string | null;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsArray() @IsUUID("all", { each: true }) attendeeIds?: string[];
}

class UpdateEventDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() allDay?: boolean;
  @IsOptional() @IsString() location?: string | null;
  @IsOptional() @IsString() notes?: string | null;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsArray() @IsUUID("all", { each: true }) attendeeIds?: string[];
}

@ApiTags("events")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("events")
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const scope = resolveFamilyScope(user, familyId);
    return this.prisma.event.findMany({
      where: {
        familyId: scope.familyId,
        ...(from || to
          ? {
              startsAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: { attendees: true },
      orderBy: { startsAt: "asc" },
    });
  }

  @Post()
  async create(
    @CurrentUser() user: AuthContext,
    @Query("familyId") familyId: string | undefined,
    @Body() dto: CreateEventDto,
  ) {
    const scope = resolveFamilyScope(user, familyId);
    if (new Date(dto.endsAt) < new Date(dto.startsAt)) {
      throw new BadRequestException("ends_at must not be before starts_at");
    }
    return this.prisma.event.create({
      data: {
        familyId: scope.familyId,
        title: dto.title,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        allDay: dto.allDay ?? false,
        location: dto.location ?? null,
        notes: dto.notes ?? null,
        color: dto.color ?? "#10b981",
        attendees: dto.attendeeIds
          ? {
              create: dto.attendeeIds.map((memberId) => ({
                memberId,
                familyId: scope.familyId,
              })),
            }
          : undefined,
      },
      include: { attendees: true },
    });
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthContext,
    @Param("id") id: string,
    @Body() dto: UpdateEventDto,
  ) {
    const existing = await this.prisma.event.findUniqueOrThrow({ where: { id } });
    const scope = resolveFamilyScope(user, existing.familyId);
    const { attendeeIds, ...rest } = dto;
    const data = {
      ...rest,
      startsAt: rest.startsAt ? new Date(rest.startsAt) : undefined,
      endsAt: rest.endsAt ? new Date(rest.endsAt) : undefined,
    };
    return this.prisma.$transaction(async (tx) => {
      await tx.event.update({ where: { id }, data });
      if (attendeeIds) {
        await tx.eventAttendee.deleteMany({ where: { eventId: id } });
        if (attendeeIds.length > 0) {
          await tx.eventAttendee.createMany({
            data: attendeeIds.map((memberId) => ({
              eventId: id,
              memberId,
              familyId: scope.familyId,
            })),
          });
        }
      }
      return tx.event.findUniqueOrThrow({ where: { id }, include: { attendees: true } });
    });
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthContext, @Param("id") id: string) {
    const existing = await this.prisma.event.findUniqueOrThrow({ where: { id } });
    resolveFamilyScope(user, existing.familyId);
    await this.prisma.event.delete({ where: { id } });
    return { ok: true };
  }
}
