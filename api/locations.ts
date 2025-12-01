import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_db.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
