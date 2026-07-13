const { readJsonBody, json } = require('../../../_utils');
const { handleCors, methodNotAllowed, sendApiError, ApiError } = require('../../_http');
const { requireUser, requireRole } = require('../../_auth');
const { requestAsService } = require('../../_supabase');
const { isUuid } = require('../../_pagination');
const { note } = require('../../_serializers');
const { noteContent } = require('../_validation');

function getId(req) {
  const id = req.query?.id;
  if (!isUuid(id)) {
    throw new ApiError(400, 'INVALID_NOTE_ID', 'The note id is invalid');
  }
  return id;
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  try {
    const identity = await requireUser(req);
    const id = getId(req);

    if (req.method === 'PATCH') {
      requireRole(identity, 'editor');
      const content = noteContent(await readJsonBody(req));
      const response = await requestAsService(`/rest/v1/gallery_notes?id=eq.${id}&deleted_at=is.null&select=id,content,created_at,updated_at`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ content })
      });
      const [updated] = await response.json();
      if (!updated) {
        throw new ApiError(404, 'NOTE_NOT_FOUND', 'The note was not found');
      }
      json(res, 200, { item: note(updated) });
      return;
    }

    if (req.method === 'DELETE') {
      requireRole(identity, 'admin');
      const response = await requestAsService(`/rest/v1/gallery_notes?id=eq.${id}&deleted_at=is.null&select=id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      const deleted = await response.json();
      if (!deleted.length) {
        throw new ApiError(404, 'NOTE_NOT_FOUND', 'The note was not found');
      }
      json(res, 200, { ok: true });
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    sendApiError(res, error);
  }
};
