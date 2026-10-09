import { BadRequestException, Injectable, UnauthorizedException, ConflictException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomBytes, createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import type { MailLocale } from "../mail/mail.types";
import { LoginDto, RegisterDto } from "./dto";

const ACCESS_TTL = process.env.JWT_ACCESS_TTL ?? "15m";
const REFRESH_TTL_DAYS = 30;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const WEB_BASE_URL = process.env.WEB_BASE_URL ?? "http://localhost:5173";

function normalizeLocale(raw: string | undefined | null): MailLocale {
  if (!raw) return "en";
  const lc = raw.toLowerCase();
  if (lc.startsWith("zh")) return "zh";
  if (lc.startsWith("vi")) return "vi";
  return "en";
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: dto.email, passwordHash },
      });
      const family = await tx.family.create({
        data: {
          name: dto.familyName,
          locale: dto.locale ?? "en",
          timezone: dto.timezone ?? "UTC",
        },
      });
      const member = await tx.member.create({
        data: {
          familyId: family.id,
          userId: user.id,
          name: dto.parentName,
          role: "parent",
          avatarEmoji: "🧑",
        },
      });
      return { user, family, member };
    });

    const tokens = await this.issueTokens(result.user.id, result.user.email);
    return { ...tokens, familyId: result.family.id, memberId: result.member.id };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { members: true },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      ...tokens,
      memberships: user.members.map((m) => ({
        memberId: m.id,
        familyId: m.familyId,
        role: m.role,
      })),
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    // Rotate: revoke old, issue new pair
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(stored.user.id, stored.user.email);
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        members: {
          include: { family: true },
        },
      },
    });
    if (!user) throw new NotFoundException();
    return {
      id: user.id,
      email: user.email,
      memberships: user.members.map((m) => ({
        memberId: m.id,
        familyId: m.familyId,
        role: m.role,
        name: m.name,
        family: m.family,
      })),
    };
  }

  /**
   * Always returns ok so attackers can't probe for registered emails.
   * In non-production the response includes the reset URL for dev convenience.
   */
  async requestPasswordReset(email: string, requestedLocale?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { members: { include: { family: true }, take: 1 } },
    });
    if (user) {
      const token = randomBytes(48).toString("base64url");
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      const resetUrl = `${WEB_BASE_URL}/reset-password?token=${token}`;

      // Prefer the caller's current UI locale, then fall back to their family's.
      const locale = normalizeLocale(requestedLocale ?? user.members[0]?.family?.locale);
      const name = user.members[0]?.name ?? null;
      await this.mail.sendPasswordReset({ to: email, resetUrl, name, locale });

      if (process.env.NODE_ENV !== "production") {
        return { ok: true as const, resetUrl };
      }
    }
    return { ok: true as const };
  }

  async resetPassword(token: string, newPassword: string) {
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException("invalid_or_expired_token");
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      // Any existing sessions become invalid after a password change.
      this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { ok: true as const };
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      { secret: process.env.JWT_ACCESS_SECRET ?? "change-me-access", expiresIn: ACCESS_TTL },
    );
    const refreshToken = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(refreshToken), expiresAt },
    });
    return { accessToken, refreshToken };
  }
}
