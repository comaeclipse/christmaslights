import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_db.js';
import { verifyJWT } from '../_auth.js';

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
  if (req.method === 'POST') {
    return handlePost(req, res);
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

  try {
    const { rows } = await query(
      'SELECT * FROM locations ORDER BY featured DESC, title ASC'
    );
    res.status(200).json(rows.map(mapLocation));
  } catch (error) {
    console.error('Failed to fetch locations', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  if (!(await ensureAuth(req, res))) return;

  try {
    const body = req.body;

    if (!body.title || !body.description || body.lat === undefined || body.lng === undefined) {
      return res.status(400).json({ error: 'Missing required fields: title, description, lat, lng' });
    }

    const id = `loc_${Date.now()}`;
    const featured = body.featured ? 1 : 0;

    await query(
      `INSERT INTO locations (id, title, description, lat, lng, featured, address, schedule, notes, radio_station)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
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
      ]
    );

    const { rows } = await query('SELECT * FROM locations WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(500).json({ error: 'Failed to retrieve created location' });
    }

    res.status(201).json(mapLocation(rows[0]));
  } catch (error) {
    console.error('Failed to create location', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
}
