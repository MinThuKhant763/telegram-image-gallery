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
    contentType: getImageContentType(filePath, response.headers.get('content-type'))
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
    const error = new Error(`Supabase insert failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }
}

async function alreadyProcessed(updateId) {
  if (!Number.isSafeInteger(updateId)) {
    return false;
  }

  const table = getEnv('SUPABASE_TABLE', DEFAULT_TABLE);
  const serviceKey = getSupabaseServiceKey();
  const url = new URL(`${process.env.SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', 'id');
  url.searchParams.set('telegram_update_id', `eq.${updateId}`);
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase idempotency check failed with ${response.status}`);
  }

  return (await response.json()).length > 0;
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

function getImageContentType(filePath, contentType = '') {
  const normalized = contentType.toLowerCase();

  if (normalized.startsWith('image/')) {
    return normalized;
  }

  const extension = filePath.split('.').pop()?.toLowerCase();

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  if (extension === 'gif') {
    return 'image/gif';
  }

  return 'image/jpeg';
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

    if (await alreadyProcessed(update.update_id)) {
      json(res, 200, { ok: true, duplicate: true });
      return;
    }

    const photo = getLargestPhoto(message.photo);
    const file = await telegramApi('getFile', { file_id: photo.file_id });
    const downloaded = await downloadTelegramFile(file.file_path);
    const extension = getExtension(file.file_path, downloaded.contentType);
    const updatePart = Number.isSafeInteger(update.update_id)
      ? String(update.update_id)
      : new Date().toISOString().replace(/[:.]/g, '-');
    const storagePath = `telegram/${senderId || 'unknown'}/${updatePart}-${photo.file_unique_id}.${extension}`;
    const imageUrl = await uploadToSupabase(storagePath, downloaded.bytes, downloaded.contentType);

    await insertImageRecord({
      image_url: imageUrl,
      storage_path: storagePath,
      telegram_file_id: photo.file_id,
      telegram_update_id: Number.isSafeInteger(update.update_id) ? update.update_id : null,
      caption: message.caption || null,
      sender_id: senderId ? String(senderId) : null,
      sender_name: getSenderName(from),
      status: 'published'
    });

    json(res, 200, { ok: true });
  } catch (error) {
    if (error.status === 409) {
      json(res, 200, { ok: true, duplicate: true });
      return;
    }

    console.error(error);
    json(res, 500, { error: error.message });
  }
};
