import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthContext } from "./jwt.strategy";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthContext;
  },
);
