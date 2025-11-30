import { Env } from '../../../types';
import { verifyJWT, jsonResponse, errorResponse } from '../../../_middleware';

export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuthorized = await verifyJWT(authHeader, env.JWT_SECRET);

    if (!isAuthorized) {
      return errorResponse('Unauthorized', 401);
    }

    const result = await env.DB.prepare(
      'DELETE FROM reviews WHERE id = ?'
    ).bind(params.id).run();

    if (result.meta.changes === 0) {
      return errorResponse('Review not found', 404);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Database error:', error);
    return errorResponse('Failed to delete review', 500);
  }
};

