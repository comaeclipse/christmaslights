import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_db.js';
import { verifyJWT } from '../../_auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isAuthorized = await verifyJWT(req.headers.authorization);
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const id = req.query.id as string | undefined;
  if (!id) {
    return res.status(400).json({ error: 'Review id is required' });
  }

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
