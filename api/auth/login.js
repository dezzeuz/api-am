import { get } from '../_lib/firebase.js';
import { signToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false });

  const key = `users_${email.replace(/\./g, '_')}`;
  const user = await get(key);
  if (!user || user.password !== password) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signToken(email);
  res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`);
  return res.json({ success: true, user });
}
