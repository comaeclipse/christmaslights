import { Env } from '../../types';
import { jsonResponse, errorResponse } from '../../_middleware';

// Map database snake_case to camelCase for frontend
const mapReview = (row: Record<string, unknown>) => ({
  id: row.id,
  locationId: row.location_id,
  rating: row.rating,
  text: row.text,
  author: row.author,
  date: row.date,
});

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('location_id');

    let stmt;
    if (locationId) {
      stmt = env.DB.prepare(
        'SELECT id, location_id, rating, text, author, date FROM reviews WHERE location_id = ? ORDER BY date DESC'
      ).bind(locationId);
    } else {
      stmt = env.DB.prepare('SELECT id, location_id, rating, text, author, date FROM reviews ORDER BY date DESC');
    }

    const { results } = await stmt.all();
    return jsonResponse(results.map(mapReview));
  } catch (error) {
    console.error('Database error:', error);
    return errorResponse('Failed to fetch reviews', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as { location_id: string; rating: number; text: string; author?: string };

    if (!body.location_id || !body.rating || !body.text) {
      return errorResponse('Missing required fields: location_id, rating, text', 400);
    }

    if (body.rating < 1 || body.rating > 5) {
      return errorResponse('Rating must be between 1 and 5', 400);
    }

    const id = `r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const date = new Date().toISOString();
    const author = body.author || 'A Festive Visitor';
    
    // Get client IP address from Cloudflare headers
    const ipAddress = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
                      'unknown';

    await env.DB.prepare(
      'INSERT INTO reviews (id, location_id, rating, text, author, date, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, body.location_id, body.rating, body.text, author, date, ipAddress).run();

    const newReview = await env.DB.prepare(
      'SELECT id, location_id, rating, text, author, date FROM reviews WHERE id = ?'
    ).bind(id).first();

    return jsonResponse(mapReview(newReview as Record<string, unknown>), 201);
  } catch (error) {
    console.error('Database error:', error);
    return errorResponse('Failed to create review', 500);
  }
};
