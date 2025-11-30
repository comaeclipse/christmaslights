import { Env } from '../../../types';
import { verifyJWT, jsonResponse, errorResponse } from '../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuthorized = await verifyJWT(authHeader, env.JWT_SECRET);

    if (!isAuthorized) {
      return errorResponse('Unauthorized', 401);
    }

    // Get all reviews with location title
    const { results } = await env.DB.prepare(`
      SELECT 
        r.id,
        r.location_id as locationId,
        r.rating,
        r.text,
        r.author,
        r.date,
        r.ip_address as ipAddress,
        l.title as locationTitle
      FROM reviews r
      LEFT JOIN locations l ON r.location_id = l.id
      ORDER BY r.date DESC
    `).all();

    return jsonResponse(results);
  } catch (error) {
    console.error('Database error:', error);
    return errorResponse('Failed to fetch reviews', 500);
  }
};

