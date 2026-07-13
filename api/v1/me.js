const { handleCors, methodNotAllowed, sendApiError } = require('./_http');
const { requireUser } = require('./_auth');
const { json } = require('../_utils');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    methodNotAllowed(res);
    return;
  }

  try {
    const { user, profile } = await requireUser(req);
    json(res, 200, {
      id: user.id,
      email: user.email || null,
      displayName: profile.display_name,
      role: profile.role
    });
  } catch (error) {
    sendApiError(res, error);
  }
};
