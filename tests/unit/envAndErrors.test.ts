import { describe, it, expect } from 'vitest';
import { getEnv } from '@/lib/env';
import {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
} from '@/lib/errors';

describe('env accessor', () => {
  it('returns valid environment object', () => {
    const env = getEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });
});

describe('errors taxonomy', () => {
  it('instantiates custom errors with expected status codes and inheritance', () => {
    const valErr = new ValidationError('Invalid title', [{ field: 'title' }]);
    expect(valErr).toBeInstanceOf(AppError);
    expect(valErr).toBeInstanceOf(Error);
    expect(valErr.statusCode).toBe(400);
    expect(valErr.name).toBe('ValidationError');
    expect(valErr.issues).toBeDefined();

    const authErr = new AuthError();
    expect(authErr.statusCode).toBe(401);
    expect(authErr.name).toBe('AuthError');

    const forbidErr = new ForbiddenError();
    expect(forbidErr.statusCode).toBe(403);

    const notFoundErr = new NotFoundError();
    expect(notFoundErr.statusCode).toBe(404);

    const rateErr = new RateLimitError();
    expect(rateErr.statusCode).toBe(429);
  });
});
