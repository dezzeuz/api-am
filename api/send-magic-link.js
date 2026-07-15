import { set } from './_lib/firebase.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  const code = uuidv4();
  // Simpan magic link di Firebase dengan key = kode
  await set(`magic_links/${code}`, { email, createdAt: Date.now() });

  console.log(`[MAGIC LINK] Untuk ${email}: code = ${code}`);

  return res.json({
    success: true,
    message: 'Magic link generated',
    code: code // Kirim kode ke response, biar user gampang test
  });
}
