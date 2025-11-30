import { Env } from '../../types';
import { createJWT, jsonResponse, errorResponse } from '../../_middleware';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as { password: string };

    if (!body.password) {
      return errorResponse('Password is required', 400);
    }

    if (body.password !== env.ADMIN_PASSWORD) {
      return errorResponse('Invalid credentials', 401);
    }

    const token = await createJWT(
      { role: 'admin' },
      env.JWT_SECRET
    );

    return jsonResponse({ token });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Login failed', 500);
  }
};
