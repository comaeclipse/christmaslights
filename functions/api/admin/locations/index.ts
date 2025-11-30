import { Env } from '../../../types';
import { verifyJWT, jsonResponse, errorResponse } from '../../../_middleware';

// Map database snake_case to camelCase for frontend
const mapLocation = (row: Record<string, unknown>) => ({
  ...row,
  radioStation: row.radio_station,
});

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuthorized = await verifyJWT(authHeader, env.JWT_SECRET);

    if (!isAuthorized) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json() as {
      title: string;
      description: string;
      lat: number;
      lng: number;
      featured?: boolean;
      address?: string;
      schedule?: string;
      notes?: string;
      radioStation?: string;
    };

    if (!body.title || !body.description || body.lat === undefined || body.lng === undefined) {
      return errorResponse('Missing required fields: title, description, lat, lng', 400);
    }

    const id = `loc_${Date.now()}`;
    const featured = body.featured ? 1 : 0;

    await env.DB.prepare(
      'INSERT INTO locations (id, title, description, lat, lng, featured, address, schedule, notes, radio_station) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      body.title,
      body.description,
      body.lat,
      body.lng,
      featured,
      body.address || null,
      body.schedule || null,
      body.notes || null,
      body.radioStation || null
    ).run();

    const newLocation = await env.DB.prepare(
      'SELECT * FROM locations WHERE id = ?'
    ).bind(id).first();

    return jsonResponse(mapLocation(newLocation as Record<string, unknown>), 201);
  } catch (error) {
    console.error('Database error:', error);
    return errorResponse('Failed to create location', 500);
  }
};
