import crypto from 'crypto';

function hashToken(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function isAuthorized(req) {
  const { cookies } = req;
  const token = cookies.auth_token;
  const correctPassword = process.env.ADMIN_PASSWORD;

  if (!correctPassword || !token) return false;

  return token === hashToken(correctPassword);
}
