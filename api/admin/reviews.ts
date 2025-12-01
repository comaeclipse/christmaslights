import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_db.js';
import { verifyJWT } from '../_auth.js';

const unauthorized = (res: VercelResponse) => res.status(401).json({ error: 'Unauthorized' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'DELETE') {
    // Prefer /api/admin/reviews/[id] for deletes, but handle here if id provided
    const id = (req.query.id as string | undefined) || undefined;
    if (!id) return res.status(400).json({ error: 'Review id is required' });
    return handleDelete(req, res, id);
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
      `
        SELECT 
          r.id,
          r.location_id,
          r.location_id AS "locationId",
          r.rating,
          r.text,
          r.author,
          r.date,
          r.created_at,
          r.ip_address AS "ipAddress",
          l.title AS "locationTitle"
        FROM reviews r
        LEFT JOIN locations l ON r.location_id = l.id
        ORDER BY r.date DESC
      `
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Failed to fetch admin reviews', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse, id: string) {
  if (!(await ensureAuth(req, res))) return;

  try {
    const { rowCount } = await query('DELETE FROM reviews WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete review', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}
