const { ApiError } = require('./_http');
const { getUserFromAccessToken, requestAsService } = require('./_supabase');

const ROLE_RANK = { viewer: 0, editor: 1, admin: 2 };

function getBearerToken(req) {
  const value = req.headers.authorization || '';
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

async function getOrCreateProfile(user) {
  const query = new URLSearchParams({
    id: `eq.${user.id}`,
    select: 'id,display_name,role',
    limit: '1'
  });
  const existing = await requestAsService(`/rest/v1/profiles?${query}`);
  const [profile] = await existing.json();

  if (profile) {
    return profile;
  }

  const response = await requestAsService('/rest/v1/profiles?select=id,display_name,role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      id: user.id,
      display_name: user.user_metadata?.full_name || user.email || null,
      role: 'viewer'
    })
  });
  const [created] = await response.json();
  return created;
}

async function requireUser(req) {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A valid access token is required');
  }

  const user = await getUserFromAccessToken(accessToken);

  if (!user?.id) {
    throw new ApiError(401, 'INVALID_ACCESS_TOKEN', 'The access token is invalid or expired');
  }

  const profile = await getOrCreateProfile(user);

  if (!profile || !(profile.role in ROLE_RANK)) {
    throw new ApiError(403, 'PROFILE_UNAVAILABLE', 'Your account profile is not available');
  }

  return { user, profile, accessToken };
}

function requireRole(identity, minimumRole) {
  if (ROLE_RANK[identity.profile.role] < ROLE_RANK[minimumRole]) {
    throw new ApiError(403, 'INSUFFICIENT_ROLE', 'You do not have permission to perform this action');
  }
}

module.exports = { requireUser, requireRole };
