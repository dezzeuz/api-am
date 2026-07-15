import { get, set, remove } from './_lib/firebase.js';
import { signToken } from './_lib/auth.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ success: false, message: 'Email & code required' });

  // 1. Cek magic link di Firebase
  const magicData = await get(`magic_links/${code}`);
  if (!magicData) return res.status(400).json({ success: false, message: 'Invalid code' });
  if (magicData.email !== email) return res.status(400).json({ success: false, message: 'Email mismatch' });

  // 2. Hapus magic link biar ga dipake lagi
  await remove(`magic_links/${code}`);

  // 3. Ambil atau buat user baru (otomatis dapet ID)
  const key = `users_${email.replace(/\./g, '_')}`;
  let user = await get(key);
  if (!user) {
    user = { id: uuidv4(), email, password: null, isPremium: false, premiumExpiresAt: null };
  }

  // 4. AUTO PREMIUM — langsung set record = 5 & aktif
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  user.isPremium = true;
  user.premiumExpiresAt = expiryDate;
  // Simpan user ke Firebase
  await set(key, user);

  // 5. Set JWT cookie biar login otomatis
  const token = signToken(email);
  res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`);

  return res.json({
    success: true,
    message: '✅ Premium berhasil diaktifkan otomatis! Record 5/5 otomatis terpenuhi.',
    data: { codeOrder: '0000-06429', user }
  });
}
