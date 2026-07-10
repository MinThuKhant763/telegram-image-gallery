const DEFAULT_BUCKET = 'gallery-images';
const DEFAULT_TABLE = 'gallery_images';

function getEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
}

function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(new Error('Request body too large'));
      }
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

function getSenderName(from = {}) {
  return [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Telegram user';
}

function isAllowedSender(senderId) {
  const allowed = getEnv('ALLOWED_TELEGRAM_USER_IDS')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    return true;
  }

  return allowed.includes(String(senderId));
}

function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = {
  DEFAULT_BUCKET,
  DEFAULT_TABLE,
  getEnv,
  getSupabaseAnonKey,
  getSupabaseServiceKey,
  getSenderName,
  isAllowedSender,
  json,
  readJsonBody,
  requireEnv
};
