import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sign } from '@tsndr/cloudflare-worker-jwt';

const getJwtSecret = () => process.env.JWT_SECRET || 'change-me-secret';

function calculateAnswer(num1: number, num2: number, operator: string): number {
  switch (operator) {
    case '+':
      return num1 + num2;
    case '-':
      return num1 - num2;
    case '×':
      return num1 * num2;
    default:
      return 0;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate random math problem
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    const answer = calculateAnswer(num1, num2, operator);

    // Create JWT token with answer and 5-minute expiration
    const exp = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    const token = await sign({ answer, exp }, getJwtSecret());

    const question = `${num1} ${operator} ${num2} = ?`;

    res.status(200).json({ question, token });
  } catch (error) {
    console.error('Failed to generate captcha', error);
    res.status(500).json({ error: 'Failed to generate captcha' });
  }
}
