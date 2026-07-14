import { Elysia } from 'elysia';
import { jwtPlugin } from './jwt';

export const adminGuard = new Elysia()
  .use(jwtPlugin)
  .derive(async ({ jwt, request }) => {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) return { jwtPayload: null };

    try {
      const payload = await jwt.verify(token);
      return { jwtPayload: payload };
    } catch {
      return { jwtPayload: null };
    }
  })
  .onBeforeHandle(({ jwtPayload, set }) => {
    // 1. Check if token exists
    if (!jwtPayload) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    // 2. Check if role is ADMIN
    if ((jwtPayload as any).role !== 'ADMIN') {
      set.status = 403;
      return { error: 'Access denied. Admins only.' };
    }
  });
