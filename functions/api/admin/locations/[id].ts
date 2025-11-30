import { Env } from '../../../types';
import { verifyJWT, jsonResponse, errorResponse } from '../../../_middleware';

// Map database snake_case to camelCase for frontend
const mapLocation = (row: Record<string, unknown>) => ({
  ...row,
  radioStation: row.radio_station,
});

export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuthorized = await verifyJWT(authHeader, env.JWT_SECRET);

    if (!isAuthorized) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json() as Record<string, any>;

    const allowedFields = ['title', 'description', 'lat', 'lng', 'featured', 'address', 'schedule', 'notes', 'radioStation'];
    const fieldMapping: Record<string, string> = { radioStation: 'radio_station' };
    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        const dbField = fieldMapping[key] || key;
        updates.push(`${dbField} = ?`);
        values.push(key === 'featured' ? (value ? 1 : 0) : value);
      }
    }

    if (updates.length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(params.id);

    await env.DB.prepare(
      `UPDATE locations SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const updatedLocation = await env.DB.prepare(
      'SELECT * FROM locations WHERE id = ?'
    ).bind(params.id).first();

    if (!updatedLocation) {
      return errorResponse('Location not found', 404);
    }

    return jsonResponse(mapLocation(updatedLocation as Record<string, unknown>));
  } catch (error) {
    console.error('Database error:', error);
    return errorResponse('Failed to update location', 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuthorized = await verifyJWT(authHeader, env.JWT_SECRET);

    if (!isAuthorized) {
      return errorResponse('Unauthorized', 401);
    }

    const result = await env.DB.prepare(
      'DELETE FROM locations WHERE id = ?'
    ).bind(params.id).run();

    if (result.meta.changes === 0) {
      return errorResponse('Location not found', 404);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Database error:', error);
    return errorResponse('Failed to delete location', 500);
  }
};
