import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_db.js';
import { verifyJWT } from '../_auth.js';

const mapSubmission = (row: any) => ({
  id: row.id,
  address: row.address,
  additionalInfo: row.additional_info,
  status: row.status,
  createdAt: row.created_at,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  reviewedAt: row.reviewed_at,
  reviewedBy: row.reviewed_by,
  rejectionReason: row.rejection_reason,
});

async function ensureAuth(req: VercelRequest, res: VercelResponse) {
  const isAuthorized = await verifyJWT(req.headers.authorization);
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  if (!(await ensureAuth(req, res))) return;

  try {
    const { rows } = await query(
      'SELECT * FROM location_submissions ORDER BY created_at DESC'
    );
    res.status(200).json(rows.map(mapSubmission));
  } catch (error) {
    console.error('Failed to fetch submissions', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  if (!(await ensureAuth(req, res))) return;

  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: 'Submission ID is required' });
  }

  try {
    await query('DELETE FROM location_submissions WHERE id = $1', [id]);
    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete submission', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
}
