import crypto from 'crypto';

function hashToken(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default function handler(req, res) {
  const correctPassword = process.env.ADMIN_PASSWORD;

  if (!correctPassword) {
    return res.status(500).json({ error: 'Server misconfiguration: ADMIN_PASSWORD not set' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (password === correctPassword) {
    const token = hashToken(password);
    res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`);
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: 'Incorrect password' });
  }
}
