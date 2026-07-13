const { readJsonBody, json } = require('../../_utils');
const { methodNotAllowed, sendApiError } = require('../_http');
const { requireUser, requireRole } = require('../_auth');
const { requestAsService } = require('../_supabase');
const { note } = require('../_serializers');
const { noteContent } = require('./_validation');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const identity = await requireUser(req);
    requireRole(identity, 'editor');
    const content = noteContent(await readJsonBody(req));
    const response = await requestAsService('/rest/v1/gallery_notes?select=id,content,created_at,updated_at', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ content, author_id: identity.user.id })
    });
    const [created] = await response.json();
    json(res, 201, { item: note(created) });
  } catch (error) {
    sendApiError(res, error);
  }
};
