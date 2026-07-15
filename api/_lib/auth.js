import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'voltage-simple-secret';

export function signToken(email) {
  return jwt.sign({ email }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

export function getCookieToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/auth_token=([^;]+)/);
  return match ? match[1] : null;
}
