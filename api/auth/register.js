import { get, set } from '../_lib/firebase.js';
import { signToken } from '../_lib/auth.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email & password required' });

  const key = `users_${email.replace(/\./g, '_')}`;
  const existing = await get(key);
  if (existing) return res.status(409).json({ success: false, message: 'User exists' });

  const user = { id: uuidv4(), email, password, isPremium: false, premiumExpiresAt: null };
  await set(key, user);

  const token = signToken(email);
  res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`);
  return res.json({ success: true, user: { id: user.id, email } });
}
