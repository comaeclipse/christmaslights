import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_db.js';
import crypto from 'node:crypto';

const mapReview = (row: any) => ({
  id: row.id,
  location_id: row.location_id,
  rating: row.rating,
  text: row.text,
  author: row.author,
  date: row.date,
  created_at: row.created_at,
  ip_address: row.ip_address,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const locationId = req.query.location_id as string | undefined;
  try {
    const { rows } = await query(
      locationId
        ? 'SELECT * FROM reviews WHERE location_id = $1 ORDER BY date DESC'
        : 'SELECT * FROM reviews ORDER BY date DESC',
      locationId ? [locationId] : undefined
    );
    res.status(200).json(rows.map(mapReview));
  } catch (error) {
    console.error('Failed to fetch reviews', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const { location_id, rating, text, author } = req.body || {};

  if (!location_id || !rating || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const id = `r_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      null;

    const insertQuery = `
      INSERT INTO reviews (id, location_id, rating, text, author, date, created_at, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const { rows } = await query(insertQuery, [
      id,
      location_id,
      rating,
      text,
      author || 'A Festive Visitor',
      now,
      now,
      ip,
    ]);

    res.status(201).json(mapReview(rows[0]));
  } catch (error) {
    console.error('Failed to create review', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
}
