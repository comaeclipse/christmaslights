import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_db.js';
import { verifyJWT } from '../../_auth.js';

const mapLocation = (row: any) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  lat: Number(row.lat),
  lng: Number(row.lng),
  featured: row.featured,
  address: row.address,
  schedule: row.schedule,
  created_at: row.created_at,
  updated_at: row.updated_at,
  notes: row.notes,
  radio_station: row.radio_station,
  radioStation: row.radio_station,
});

const unauthorized = (res: VercelResponse) => res.status(401).json({ error: 'Unauthorized' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'PUT') {
    return handlePut(req, res);
  }
  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function ensureAuth(req: VercelRequest, res: VercelResponse) {
  const isAuthorized = await verifyJWT(req.headers.authorization);
  if (!isAuthorized) {
    unauthorized(res);
    return false;
  }
  return true;
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  if (!(await ensureAuth(req, res))) return;

  const id = req.query.id as string;

  try {
    const { rows } = await query('SELECT * FROM locations WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.status(200).json(mapLocation(rows[0]));
  } catch (error) {
    console.error('Failed to fetch location', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
}

async function handlePut(req: VercelRequest, res: VercelResponse) {
  if (!(await ensureAuth(req, res))) return;

  const id = req.query.id as string;
  const body = req.body;

  try {
    const allowedFields = ['title', 'description', 'lat', 'lng', 'featured', 'address', 'schedule', 'notes', 'radioStation'];
    const fieldMapping: Record<string, string> = { radioStation: 'radio_station' };
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        const dbField = fieldMapping[key] || key;
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(key === 'featured' ? (value ? 1 : 0) : value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await query(
      `UPDATE locations SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    const { rows } = await query('SELECT * FROM locations WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.status(200).json(mapLocation(rows[0]));
  } catch (error) {
    console.error('Failed to update location', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  if (!(await ensureAuth(req, res))) return;

  const id = req.query.id as string;

  try {
    const { rowCount } = await query('DELETE FROM locations WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete location', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
}
