const { getEnv, getSupabaseServiceKey, json, readJsonBody, requireEnv } = require('./_utils');

const DEFAULT_NOTES_TABLE = 'gallery_notes';

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

async function createNote(req, res) {
  const body = await readJsonBody(req);
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!content) {
    json(res, 400, { error: 'Note content is required' });
    return;
  }

  if (content.length > 1000) {
    json(res, 400, { error: 'Notes can be up to 1000 characters' });
    return;
  }

  const table = getEnv('SUPABASE_NOTES_TABLE', DEFAULT_NOTES_TABLE);
  const response = await supabaseFetch(`/rest/v1/${table}?select=id,content,created_at`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({ content })
  });
  const [note] = await response.json();

  json(res, 201, { note });
}

async function deleteNote(req, res) {
  const id = req.query?.id;

  if (!id) {
    json(res, 400, { error: 'Missing note id' });
    return;
  }

  const table = getEnv('SUPABASE_NOTES_TABLE', DEFAULT_NOTES_TABLE);
  const response = await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' }
  });
  const deleted = await response.json();

  if (!deleted.length) {
    json(res, 404, { error: 'Note not found' });
    return;
  }

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

    if (req.method === 'POST') {
      await createNote(req, res);
      return;
    }

    if (req.method === 'DELETE') {
      await deleteNote(req, res);
      return;
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
