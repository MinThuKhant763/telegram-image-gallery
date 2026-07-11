const { getEnv, getSupabaseAnonKey, json } = require('./_utils');

const DEFAULT_NOTES_TABLE = 'gallery_notes';

function getLimit(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    return 100;
  }

  return Math.min(Math.max(parsed, 1), 200);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const anonKey = getSupabaseAnonKey();

    if (!process.env.SUPABASE_URL || !anonKey) {
      throw new Error('Missing required Supabase public configuration');
    }

    const table = getEnv('SUPABASE_NOTES_TABLE', DEFAULT_NOTES_TABLE);
    const url = new URL(`${process.env.SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.set('select', 'id,content,created_at');
    url.searchParams.set('order', 'created_at.desc');
    url.searchParams.set('limit', String(getLimit(req.query?.limit)));

    const response = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      }
    });

    if (!response.ok) {
      const detail = await response.text();
      json(res, response.status, { error: 'Could not load notes', detail });
      return;
    }

    json(res, 200, { notes: await response.json() });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
