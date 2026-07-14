import { jwt } from '@elysiajs/jwt';

// Pre-configured JWT plugin for the API Gateway
// Matches the same secret used by users-service and order-service
export const jwtPlugin = jwt({
  name: 'jwt',
  secret: process.env.JWT_SECRET!,
});
