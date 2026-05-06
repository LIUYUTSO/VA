import fs from 'fs/promises';
import { isAuthorized } from '../../utils/auth';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const collections = req.body;
    await fs.writeFile('data/collections.json', JSON.stringify(collections));
    res.status(200).json({ success: true });
  } else if (req.method === 'GET') {
    const data = await fs.readFile('data/collections.json', 'utf8');
    res.status(200).json(JSON.parse(data));
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
