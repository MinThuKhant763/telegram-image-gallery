const { getSupabaseAnonKey, getSupabaseServiceKey, requireEnv } = require('../_utils');

function requirePublicConfig() {
  const publicKey = getSupabaseAnonKey();
  requireEnv(['SUPABASE_URL']);

  if (!publicKey) {
    throw new Error('Missing required Supabase public key');
  }

  return publicKey;
}

function requireServiceConfig() {
  const serviceKey = getSupabaseServiceKey();
  requireEnv(['SUPABASE_URL']);

  if (!serviceKey) {
    throw new Error('Missing required Supabase server key');
  }

  return serviceKey;
}

async function requestAsService(path, options = {}) {
  const serviceKey = requireServiceConfig();
  const response = await fetch(`${process.env.SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const error = new Error(`Supabase request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response;
}

async function getUserFromAccessToken(accessToken) {
  const publicKey = requirePublicConfig();
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: publicKey
    }
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

module.exports = { requestAsService, getUserFromAccessToken };
