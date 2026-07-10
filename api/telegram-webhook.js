const {
  DEFAULT_BUCKET,
  DEFAULT_TABLE,
  getEnv,
  getSenderName,
  getSupabaseServiceKey,
  isAllowedSender,
  json,
  readJsonBody,
  requireEnv
} = require('./_utils');

async function telegramApi(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const body = await response.json();

  if (!response.ok || !body.ok) {
    throw new Error(`Telegram ${method} failed: ${JSON.stringify(body)}`);
  }

  return body.result;
}

async function downloadTelegramFile(filePath) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const response = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);

  if (!response.ok) {
    throw new Error(`Telegram file download failed with ${response.status}`);
  }

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || 'image/jpeg'
  };
}

async function uploadToSupabase(path, bytes, contentType) {
  const bucket = getEnv('SUPABASE_BUCKET', DEFAULT_BUCKET);
  const serviceKey = getSupabaseServiceKey();
  const url = `${process.env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': contentType,
      'x-upsert': 'true'
    },
    body: bytes
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase upload failed: ${detail}`);
  }

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

async function insertImageRecord(record) {
  const table = getEnv('SUPABASE_TABLE', DEFAULT_TABLE);
  const serviceKey = getSupabaseServiceKey();
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase insert failed: ${detail}`);
  }
}

function getLargestPhoto(photos = []) {
  return photos.reduce((largest, photo) => {
    if (!largest || (photo.file_size || 0) > (largest.file_size || 0)) {
      return photo;
    }

    return largest;
  }, null);
}

function getExtension(filePath, contentType) {
  const fromPath = filePath.split('.').pop();

  if (fromPath && fromPath.length <= 5) {
    return fromPath;
  }

  if (contentType.includes('png')) {
    return 'png';
  }

  if (contentType.includes('webp')) {
    return 'webp';
  }

  return 'jpg';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    requireEnv(['SUPABASE_URL', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_SECRET_TOKEN']);

    if (!getSupabaseServiceKey()) {
      throw new Error('Missing required Supabase server key');
    }

    const requestSecret = req.headers['x-telegram-bot-api-secret-token'];

    if (requestSecret !== process.env.TELEGRAM_SECRET_TOKEN) {
      json(res, 401, { error: 'Invalid Telegram secret token' });
      return;
    }

    const update = await readJsonBody(req);
    const message = update.message || update.channel_post;
    const from = message?.from || message?.sender_chat || {};
    const senderId = from.id;

    if (!message?.photo) {
      json(res, 200, { ok: true, ignored: 'No photo in message' });
      return;
    }

    if (!isAllowedSender(senderId)) {
      json(res, 200, { ok: true, ignored: 'Sender is not allowed' });
      return;
    }

    const photo = getLargestPhoto(message.photo);
    const file = await telegramApi('getFile', { file_id: photo.file_id });
    const downloaded = await downloadTelegramFile(file.file_path);
    const extension = getExtension(file.file_path, downloaded.contentType);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const storagePath = `telegram/${senderId || 'unknown'}/${timestamp}-${photo.file_unique_id}.${extension}`;
    const imageUrl = await uploadToSupabase(storagePath, downloaded.bytes, downloaded.contentType);

    await insertImageRecord({
      image_url: imageUrl,
      storage_path: storagePath,
      telegram_file_id: photo.file_id,
      caption: message.caption || null,
      sender_id: senderId ? String(senderId) : null,
      sender_name: getSenderName(from),
      status: 'published'
    });

    json(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    json(res, 500, { error: error.message });
  }
};
