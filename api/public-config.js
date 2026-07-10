const { getSupabaseAnonKey, json } = require('./_utils');

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

    json(res, 200, {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: anonKey
    });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
