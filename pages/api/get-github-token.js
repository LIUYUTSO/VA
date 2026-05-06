// This endpoint has been removed for security reasons.
// GitHub operations are handled server-side via /api/github-sync.
export default function handler(req, res) {
  return res.status(410).json({ error: 'This endpoint has been removed. Use /api/github-sync instead.' });
}
