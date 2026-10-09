import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export interface AuthContext {
  userId: string;
  email: string;
  memberships: { memberId: string; familyId: string; role: "parent" | "child" }[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? "change-me-access",
    });
  }

  async validate(payload: JwtPayload): Promise<AuthContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { members: true },
    });
    if (!user) throw new UnauthorizedException();
    return {
      userId: user.id,
      email: user.email,
      memberships: user.members.map((m) => ({
        memberId: m.id,
        familyId: m.familyId,
        role: m.role,
      })),
    };
  }
}
