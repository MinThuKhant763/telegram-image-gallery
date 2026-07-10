const { DEFAULT_TABLE, getEnv, getSupabaseAnonKey, json } = require('./_utils');

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

    const table = getEnv('SUPABASE_TABLE', DEFAULT_TABLE);
    const url = new URL(`${process.env.SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.set('select', 'id,image_url,caption,sender_name,created_at');
    url.searchParams.set('status', 'eq.published');
    url.searchParams.set('order', 'created_at.desc');
    url.searchParams.set('limit', req.query?.limit || '100');

    const response = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      }
    });

    if (!response.ok) {
      const detail = await response.text();
      json(res, response.status, { error: 'Could not load gallery', detail });
      return;
    }

    json(res, 200, { images: await response.json() });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
