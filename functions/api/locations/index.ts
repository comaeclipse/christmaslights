import { Env } from '../../types';
import { jsonResponse, errorResponse } from '../../_middleware';

// Map database snake_case to camelCase for frontend
const mapLocation = (row: Record<string, unknown>) => ({
  ...row,
  radioStation: row.radio_station,
});

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM locations ORDER BY featured DESC, title ASC'
    ).all();

    return jsonResponse(results.map(mapLocation));
  } catch (error) {
    console.error('Database error:', error);
    return errorResponse('Failed to fetch locations', 500);
  }
};
