import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Lo que JwtStrategy.validate() deja en request.user. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
