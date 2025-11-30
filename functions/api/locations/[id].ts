import { Env } from '../../types';
import { jsonResponse, errorResponse } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const location = await env.DB.prepare(
      'SELECT * FROM locations WHERE id = ?'
    ).bind(params.id).first();

    if (!location) {
      return errorResponse('Location not found', 404);
    }

    return jsonResponse(location);
  } catch (error) {
    console.error('Database error:', error);
    return errorResponse('Failed to fetch location', 500);
  }
};
