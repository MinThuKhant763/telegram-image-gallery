const { DEFAULT_TABLE, getEnv, getSupabaseServiceKey, json, readJsonBody, requireEnv } = require('./_utils');

function isAuthorized(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.headers['x-admin-token'];
  return Boolean(process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN);
}

async function supabaseFetch(path, options = {}) {
  const serviceKey = getSupabaseServiceKey();
  const response = await fetch(`${process.env.SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed: ${detail}`);
  }

  return response;
}

async function findImage(id) {
  const table = getEnv('SUPABASE_TABLE', DEFAULT_TABLE);
  const url = `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=id,storage_path&limit=1`;
  const response = await supabaseFetch(url);
  const rows = await response.json();
  return rows[0] || null;
}

async function listImages(req, res) {
  const table = getEnv('SUPABASE_TABLE', DEFAULT_TABLE);
  const response = await supabaseFetch(
    `/rest/v1/${table}?select=id,image_url,storage_path,caption,sender_name,status,created_at&order=created_at.desc&limit=200`
  );

  json(res, 200, { images: await response.json() });
}

async function updateImage(req, res) {
  const body = await readJsonBody(req);

  if (!body.id) {
    json(res, 400, { error: 'Missing image id' });
    return;
  }

  const updates = {};

  if (typeof body.caption === 'string') {
    updates.caption = body.caption.trim() || null;
  }

  if (['published', 'hidden'].includes(body.status)) {
    updates.status = body.status;
  }

  if (!Object.keys(updates).length) {
    json(res, 400, { error: 'No valid updates provided' });
    return;
  }

  const table = getEnv('SUPABASE_TABLE', DEFAULT_TABLE);
  await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(body.id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(updates)
  });

  json(res, 200, { ok: true });
}

async function deleteImage(req, res) {
  const id = req.query?.id;

  if (!id) {
    json(res, 400, { error: 'Missing image id' });
    return;
  }

  const image = await findImage(id);
  const table = getEnv('SUPABASE_TABLE', DEFAULT_TABLE);

  if (image?.storage_path) {
    const bucket = getEnv('SUPABASE_BUCKET', 'gallery-images');
    await supabaseFetch(`/storage/v1/object/${bucket}/${image.storage_path}`, {
      method: 'DELETE'
    });
  }

  await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' }
  });

  json(res, 200, { ok: true });
}

module.exports = async function handler(req, res) {
  try {
    requireEnv(['SUPABASE_URL', 'ADMIN_TOKEN']);

    if (!getSupabaseServiceKey()) {
      throw new Error('Missing required Supabase server key');
    }

    if (!isAuthorized(req)) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    if (req.method === 'GET') {
      await listImages(req, res);
      return;
    }

    if (req.method === 'PATCH') {
      await updateImage(req, res);
      return;
    }

    if (req.method === 'DELETE') {
      await deleteImage(req, res);
      return;
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
