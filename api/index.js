// ============================================================================
// ⚡ AM GENERATOR PREMIUM - VERCEL SERVERLESS EDITION (v2.0.0) ⚡
// ============================================================================
// Zero .env | Firebase RTDB Storage | @sparticuz/chromium Engine
// ============================================================================

const { addExtra } = require('puppeteer-extra');
const puppeteerCore = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const nodemailer = require('nodemailer');

const puppeteer = addExtra(puppeteerCore);
puppeteer.use(StealthPlugin());

// ----------------------------------------------------------------------------
// 📌 KONFIGURASI APP (TANPA .ENV) - EDIT LANGSUNG DI SINI
// ----------------------------------------------------------------------------
const CONFIG_APP = {
  FIREBASE_RTDB_URL: "https://dezztoolsv2-default-rtdb.firebaseio.com",
  TARGET_URL: "https://amprem.irfanjawa.com",
  MASTER_EMAIL: "serbamurahstore123@gmail.com",
  MASTER_PASSWORD: "fakePwPC123@",
  SMTP: {
    USER: "lanngood25@gmail.com",
    PASS: "mvok wyrf nglp geru"
  }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ----------------------------------------------------------------------------
// 💾 BAGIAN 1: FIREBASE RTDB STORAGE (PENGGANTI LOCAL FS / CONFIG.JSON)
// ----------------------------------------------------------------------------
async function getConfig() {
  try {
    const res = await fetch(`${CONFIG_APP.FIREBASE_RTDB_URL}/config_prem.json`);
    const data = await res.json();
    return data || { session: "", cf_clearance: "", ads_done: true };
  } catch (e) {
    return { session: "", cf_clearance: "" };
  }
}

async function saveConfig(newConfig) {
  try {
    await fetch(`${CONFIG_APP.FIREBASE_RTDB_URL}/config_prem.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function saveJobStatus(jobId, jobData) {
  try {
    await fetch(`${CONFIG_APP.FIREBASE_RTDB_URL}/jobs/${jobId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
  } catch (e) {}
}

async function getJobStatus(jobId) {
  try {
    const res = await fetch(`${CONFIG_APP.FIREBASE_RTDB_URL}/jobs/${jobId}.json`);
    return await res.json();
  } catch (e) {
    return null;
  }
}

// ----------------------------------------------------------------------------
// 📧 BAGIAN 2: NODEMAILER (NOTIFIKASI EMAIL)
// ----------------------------------------------------------------------------
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: CONFIG_APP.SMTP.USER, pass: CONFIG_APP.SMTP.PASS }
});

async function sendNotificationEmail(targetEmail, isSuccess, codeOrder, failMessage) {
  if (!targetEmail || targetEmail === 'test@gmail.com' || targetEmail === CONFIG_APP.MASTER_EMAIL) return;
  try {
    const subject = isSuccess ? '🚀 [MotionHub] Berhasil Upgrade Akun Premium' : '⚠️ [MotionHub] Gagal Upgrade Akun';
    const htmlBody = `
    <div style="background-color: #09090b; padding: 40px 10px; font-family: sans-serif; color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 35px;">
            <h2 style="color: #ffffff; text-align: center;">MOTION<span style="color: #3b82f6;">HUB</span></h2>
            <hr style="border-color: #27272a;">
            <p>Hi <strong>${targetEmail}</strong>,</p>
            <p>Permintaan upgrade akun Anda telah selesai diproses:</p>
            <div style="background-color: #0f0f11; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p>Status: <strong style="color: ${isSuccess ? '#34d399' : '#f87171'};">${isSuccess ? 'Verified & Active ✓' : 'Upgrade Failed ✕'}</strong></p>
                ${isSuccess ? `<p>Order Ref: <strong>${codeOrder || 'VIP-ACTIVE'}</strong></p>` : `<p>Error: ${failMessage || 'System Error'}</p>`}
            </div>
            <p style="font-size: 12px; color: #71717a; text-align: center;">&copy; ${new Date().getFullYear()} MotionHub Inc.</p>
        </div>
    </div>`;

    await emailTransporter.sendMail({
      from: `"MotionHub Support" <${CONFIG_APP.SMTP.USER}>`,
      to: targetEmail, subject, html: htmlBody
    });
  } catch (err) {}
}

// ----------------------------------------------------------------------------
// 🤖 BAGIAN 3: PUPPETEER AUTOMATION ENGINE (SERVERLESS MODIFIED)
// ----------------------------------------------------------------------------
async function isChallenging(page) {
  try {
    const title = (await page.title()).toLowerCase();
    const cfSignals = [
      title.includes('just a moment'), title.includes('checking your browser'),
      title.includes('please wait'), title.includes('attention required'),
      title.includes('cloudflare')
    ];
    return cfSignals.some(Boolean);
  } catch { return false; }
}

async function tryClickTurnstile(page) {
  try {
    for (const frm of page.frames()) {
      const fUrl = frm.url();
      if (fUrl.includes('challenges.cloudflare.com') || fUrl.includes('turnstile')) {
        const frameEle = await frm.frameElement();
        if (frameEle) {
          const box = await frameEle.boundingBox();
          if (box && box.width > 10 && box.height > 10) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            await sleep(1500);
            return true;
          }
        }
      }
    }
  } catch (e) {}
  return false;
}

async function ensureMasterLogin(page) {
  await page.goto(`${CONFIG_APP.TARGET_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(()=>{});
  await sleep(1500);
  if (await isChallenging(page)) await tryClickTurnstile(page);
  
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });
    await page.type('input[type="email"]', CONFIG_APP.MASTER_EMAIL);
    await page.type('input[type="password"]', CONFIG_APP.MASTER_PASSWORD);
    await page.click('button[type="submit"]');
    await sleep(3000);
    await page.goto(`${CONFIG_APP.TARGET_URL}/dashboard/generator`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(()=>{});
    await sleep(2000);
  } catch(e) {}
}

async function runAutomation(action, emailTarget = "", magicLink = "") {
  let browser = null;
  const result = { success: false, action, message: "", apply_res: null, verif_res: null };

  try {
    // Launcher Khusus Vercel Serverless Chrome
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    const cfg = await getConfig();

    // Set Cookie dari Firebase
    if (cfg.session) {
      await page.setCookie({
        name: 'session', value: cfg.session,
        domain: 'amprem.irfanjawa.com', path: '/'
      });
    }
    if (cfg.cf_clearance) {
      await page.setCookie({
        name: 'cf_clearance', value: cfg.cf_clearance,
        domain: 'amprem.irfanjawa.com', path: '/'
      });
    }

    let targetUrl = `${CONFIG_APP.TARGET_URL}/dashboard/generator`;
    if (action === "send") targetUrl = `${CONFIG_APP.TARGET_URL}/auth`;

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(()=>{});
    await sleep(2000);

    // Bypass Turnstile Cloudflare jika muncul
    if (await isChallenging(page)) {
      await tryClickTurnstile(page);
      await sleep(2000);
    }

    // Cek Sesi dan Auto-Login Master kalau perlu
    let cookies = await page.cookies(CONFIG_APP.TARGET_URL);
    let sessionCookie = cookies.find(c => c.name === 'session');

    if (!sessionCookie && action !== "send") {
      await ensureMasterLogin(page);
      cookies = await page.cookies(CONFIG_APP.TARGET_URL);
      sessionCookie = cookies.find(c => c.name === 'session');
      if (sessionCookie) {
        await saveConfig({ session: sessionCookie.value });
      } else {
        throw new Error("Gagal login ke akun Master.");
      }
    }

    // EKSEKUSI 1: KEEP ALIVE
    if (action === "keep_alive") {
      const resKeepAlive = await page.evaluate(async () => {
        try {
          let r = await fetch('/api/user', { method: 'GET', credentials: 'include' });
          return { status: r.status, data: await r.json() };
        } catch(e) { return { error: e.toString() }; }
      });
      result.success = true;
      result.message = "Session berhasil disegarkan via Serverless.";
      result.apply_res = resKeepAlive;
    }

    // EKSEKUSI 2: SEND MAGIC LINK
    else if (action === "send" && emailTarget) {
      const resSend = await page.evaluate(async (email) => {
        try {
          let r = await fetch('/api/auth/send-magic-link', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          return { status: r.status, data: await r.json() };
        } catch(e) { return { error: e.toString() }; }
      }, emailTarget);
      
      result.apply_res = resSend;
      result.success = resSend?.data?.success === true || resSend?.status === 200;
      result.message = result.success ? "Magic link berhasil dikirim." : "Gagal mengirim link.";
    }

    // EKSEKUSI 3: VERIFY & CLAIM / CLAIM ONLY
    else if (action === "verify_and_claim" || action === "claim_only") {
      
      if (action === "verify_and_claim" && magicLink) {
        await page.evaluate(async (email) => {
          localStorage.clear(); sessionStorage.clear();
          localStorage.setItem('emailForSignIn', email);
        }, emailTarget);

        const verifRes = await page.evaluate(async (email, link) => {
          try {
            const res = await fetch('/api/auth/verify-magic-link', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, magicLink: link })
            });
            return { status: res.status, data: await res.json() };
          } catch(e) { return { status: 0, error: e.message }; }
        }, emailTarget, magicLink);

        result.verif_res = verifRes;
        await sleep(1500);
        await page.reload({ waitUntil: 'networkidle2' }).catch(()=>{});
        await sleep(1500);
      }

      // Bypass 5 Iklan (Loop Dipercepat agar tidak hit timeout Vercel)
      for (let step = 1; step <= 6; step++) {
        try {
          const resRecord = await page.evaluate(async () => {
            const r = await fetch('/api/ads/record', {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
              credentials: 'include', body: JSON.stringify({})
            });
            return { status: r.status, text: await r.text() };
          });
          if (resRecord.text && (resRecord.text.includes('5/5') || resRecord.text.toLowerCase().includes('selesai'))) break;
          await sleep(800);
        } catch (e) { break; }
      }

      await sleep(1500);

      // Tembak API Apply VIP
      const resApply = await page.evaluate(async () => {
        try {
          const r = await fetch('/api/generator/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Referer': window.location.href },
            credentials: 'include'
          });
          return { status: r.status, data: await r.json() };
        } catch(e) { return { status: 0, error: e.message }; }
      });

      result.apply_res = resApply;
      result.success = resApply?.status === 200 && resApply?.data?.success === true;
      result.message = result.success ? "APPLY BERHASIL! VIP diaktifkan!" : "Gagal mengklaim VIP.";

      // Save cookie terbaru ke Firebase
      const cookiesNow = await page.cookies(CONFIG_APP.TARGET_URL);
      const cfNow = cookiesNow.find(c => c.name === 'cf_clearance');
      const sessNow = cookiesNow.find(c => c.name === 'session');
      const cfgUpdate = { ads_done: true, ads_and_apply_done: result.success };
      if (cfNow) cfgUpdate.cf_clearance = cfNow.value;
      if (sessNow) cfgUpdate.session = sessNow.value;
      await saveConfig(cfgUpdate);
    }

    // Simpan Cookie Terakhir Sebelum Tutup
    const finalCookies = await page.cookies(CONFIG_APP.TARGET_URL);
    const finalCf = finalCookies.find(c => c.name === 'cf_clearance');
    if (finalCf) await saveConfig({ cf_clearance: finalCf.value });

  } catch (err) {
    result.message = err.message;
  } finally {
    if (browser) await browser.close().catch(()=>{});
  }

  return result;
}

// ----------------------------------------------------------------------------
// 🌐 BAGIAN 4: VERCEL SERVERLESS HTTP ROUTER (REPLACING HTTP.CREATESERVER)
// ----------------------------------------------------------------------------
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method.toUpperCase();

  try {
    // 1. GET / -> Dokumentasi & Health Check
    if ((pathname === '/' || pathname === '/api') && method === 'GET') {
      const config = await getConfig();
      return res.status(200).json({
        status: "ONLINE",
        service: "AM Generator Premium Serverless API",
        version: "2.0.0 (Vercel Serverless Edition)",
        storage: "Firebase RTDB Connected",
        config: {
          session_configured: !!config.session,
          cf_clearance_configured: !!config.cf_clearance
        },
        endpoints: {
          "GET /api/status": "Cek konfigurasi dari Firebase RTDB.",
          "GET|POST /api/keepalive": "Auto-refresh cookie (Dipanggil oleh Vercel Cron).",
          "POST /api/send": "Kirim magic link ke email target.",
          "POST /api/verify": "Verifikasi link, bypass iklan & klaim VIP.",
          "POST /api/claim": "Bypass iklan & klaim VIP sesi aktif."
        }
      });
    }

    // 2. GET /api/status
    if (pathname === '/api/status' && method === 'GET') {
      const config = await getConfig();
      return res.status(200).json({
        success: true, message: "Status Sesi Cookie Aktif (Firebase RTDB)",
        cookies: config
      });
    }

    // 3. POST /api/config (Update manual ke Firebase)
    if (pathname === '/api/config' && method === 'POST') {
      await saveConfig(req.body);
      return res.status(200).json({
        success: true, message: "Konfigurasi Firebase RTDB berhasil diperbarui.",
        updated_config: await getConfig()
      });
    }

    // 4. GET /api/result/:jobId (Cek status job dari Firebase)
    if (pathname.startsWith('/api/result/') && method === 'GET') {
      const jobId = pathname.replace('/api/result/', '');
      const job = await getJobStatus(jobId);
      if (!job) return res.status(404).json({ success: false, error: `Job '${jobId}' tidak ditemukan.` });
      return res.status(job.status === 'done' ? 200 : 202).json(job);
    }

    // 5. GET|POST /api/keepalive (Dipicu otomatis oleh Vercel Cron)
    if (pathname === '/api/keepalive') {
      const exec = await runAutomation('keep_alive');
      return res.status(200).json(exec);
    }

    // 6. POST /api/send | /api/verify | /api/claim
    if ((pathname === '/api/send' || pathname === '/api/verify' || pathname === '/api/claim') && method === 'POST') {
      const { email = "", magicLink = "", link = "" } = req.body || {};
      const targetEmail = email.trim();
      const targetLink = (magicLink || link).trim();

      if (!targetEmail) return res.status(400).json({ success: false, error: "Parameter 'email' wajib diisi." });

      let action = targetLink ? 'verify_and_claim' : 'claim_only';
      if (pathname === '/api/send') action = 'send';

      const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
      
      // Simpan status awal ke Firebase
      await saveJobStatus(jobId, { status: 'processing', action, email: targetEmail, started_at: new Date().toISOString() });

      // JALANKAN LANGSUNG (Di Serverless Vercel kita harus await agar tidak dimatikan)
      const execResult = await runAutomation(action, targetEmail, targetLink);

      // Ambil codeOrder jika ada
      const applyData = execResult.apply_res?.data || execResult.apply_res || {};
      const codeOrder = applyData?.data?.codeOrder || applyData?.codeOrder || (execResult.success ? "VIP-SUCCESS" : null);
      const failMsg = applyData?.message || execResult.message || "Gagal menerapkan premium";

      const finalJobData = {
        status: execResult.success ? 'done' : 'failed',
        success: execResult.success,
        action, email: targetEmail,
        receipt: execResult.success ? { email: targetEmail, status: "ACTIVE PREMIUM / VIP", codeOrder } : null,
        message: failMsg,
        details: execResult,
        finished_at: new Date().toISOString()
      };

      // Simpan hasil akhir ke Firebase & Kirim Email
      await saveJobStatus(jobId, finalJobData);
      if (action !== 'send') {
        await sendNotificationEmail(targetEmail, execResult.success, codeOrder, failMsg);
      }

      return res.status(execResult.success ? 200 : 422).json({
        job_id: jobId,
        ...finalJobData
      });
    }

    return res.status(404).json({ success: false, error: "Endpoint tidak ditemukan." });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Internal Server Error", message: error.message });
  }
};
