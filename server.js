// Complete Express API for amprem clone
// Includes: Register, Login (random email), Send Magic Link, Verify Magic Link, Record Ads, Apply Premium
// Turnstile mock: accepts "auto-verified" and "success"
// Session based for tracking user progress

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'voltage-coder-x-amprem-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // set to true if using HTTPS (e.g., Vercel production)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// In-Memory Storage (resets on server restart)
const users = new Map();         // email -> { id, password, isPremium, premiumExpiresAt }
const magicLinks = new Map();    // email -> { code, expiresAt }
const adProgress = new Map();    // email -> count (0-5)

// --- Helper: Mock Turnstile Verification ---
const verifyTurnstile = (token) => {
  return token === 'auto-verified' || token === 'success';
};

// --- 1. Register (Accept random email) ---
app.post('/api/auth/register', (req, res) => {
  const { email, password, turnstileToken } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  if (!verifyTurnstile(turnstileToken)) {
    return res.status(403).json({ success: false, message: 'Turnstile verification failed' });
  }

  if (users.has(email)) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }

  const user = {
    id: uuidv4(),
    email,
    password,
    isPremium: false,
    premiumExpiresAt: null
  };
  users.set(email, user);
  req.session.email = email; // Auto-login after register

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email
    }
  });
});

// --- 2. Login (Accept random email) ---
app.post('/api/auth/login', (req, res) => {
  const { email, password, turnstileToken } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  if (!verifyTurnstile(turnstileToken)) {
    return res.status(403).json({ success: false, message: 'Turnstile verification failed' });
  }

  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  req.session.email = email;

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt
    }
  });
});

// --- 3. Send Magic Link (Specific email, not random) ---
app.post('/api/auth/send-magic-link', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  const code = uuidv4();
  const magicLink = `https://amprem.irfanjawa.com/verify?code=${code}`;
  
  // Store with 15 minutes expiry
  magicLinks.set(email, {
    code,
    expiresAt: Date.now() + 15 * 60 * 1000
  });

  // Log the link (since we don't have SMTP, user can copy this from terminal)
  console.log(`[MAGIC LINK GENERATED] For ${email}: ${magicLink}`);

  res.json({
    success: true,
    message: 'Magic link berhasil dikirim ke email Anda.'
  });
});

// --- 4. Verify Magic Link ---
app.post('/api/auth/verify-magic-link', (req, res) => {
  const { email, magicLink } = req.body;
  if (!email || !magicLink) {
    return res.status(400).json({ success: false, message: 'Email and magicLink required' });
  }

  const stored = magicLinks.get(email);
  if (!stored) {
    return res.status(400).json({ success: false, message: 'No magic link requested for this email' });
  }

  const expectedLink = `https://amprem.irfanjawa.com/verify?code=${stored.code}`;
  if (magicLink !== expectedLink || stored.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired magic link' });
  }

  // Consume the link
  magicLinks.delete(email);

  // Simulate Firebase linking — create user if not exists
  if (!users.has(email)) {
    const newUser = {
      id: uuidv4(),
      email,
      password: null,
      isPremium: false,
      premiumExpiresAt: null
    };
    users.set(email, newUser);
  }

  req.session.email = email;

  res.json({
    success: true,
    message: 'Akun Firebase berhasil ditautkan! Silakan selesaikan 5 iklan untuk mengaktifkan premium.',
    user: { email }
  });
});

// --- 5. Record Ads (Track 5 times) ---
app.post('/api/ads/record', (req, res) => {
  const email = req.session.email;
  if (!email) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  let count = adProgress.get(email) || 0;
  count += 1;
  adProgress.set(email, count);

  const message = count < 5 ? `Progress: ${count}/5` : 'Progress: 5/5';

  res.json({
    success: true,
    count: count,
    message: message
  });
});

// --- 6. Apply Premium ---
app.post('/api/generator/apply', (req, res) => {
  const email = req.session.email;
  if (!email) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const progress = adProgress.get(email) || 0;
  if (progress < 5) {
    return res.status(400).json({ success: false, message: 'Belum menyelesaikan 5 iklan' });
  }

  const user = users.get(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Activate premium (30 days)
  user.isPremium = true;
  user.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  users.set(email, user);

  res.json({
    success: true,
    message: '✅ Premium berhasil diaktifkan! Selamat menikmati fitur premium.',
    data: {
      codeOrder: '0000-06429'
    }
  });
});

// --- Health Check ---
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    session: req.session.email || null
  });
});

// Export for Vercel, or listen directly for standalone
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`⚡ Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
