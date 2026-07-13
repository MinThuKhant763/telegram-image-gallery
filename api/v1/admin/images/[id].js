const { readJsonBody, json } = require('../../../_utils');
const { handleCors, methodNotAllowed, sendApiError, ApiError } = require('../../_http');
const { requireUser, requireRole } = require('../../_auth');
const { requestAsService } = require('../../_supabase');
const { isUuid } = require('../../_pagination');
const { image } = require('../../_serializers');
const { imageUpdates } = require('../_validation');

function getId(req) {
  const id = req.query?.id;
  if (!isUuid(id)) {
    throw new ApiError(400, 'INVALID_IMAGE_ID', 'The image id is invalid');
  }
  return id;
}

async function getImage(id) {
  const params = new URLSearchParams({
    id: `eq.${id}`,
    select: 'id,image_url,caption,sender_name,status,created_at,updated_at,width,height,blurhash',
    deleted_at: 'is.null',
    limit: '1'
  });
  const response = await requestAsService(`/rest/v1/gallery_images?${params}`);
  const [row] = await response.json();

  if (!row) {
    throw new ApiError(404, 'IMAGE_NOT_FOUND', 'The image was not found');
  }

  return image(row);
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  try {
    const identity = await requireUser(req);
    const id = getId(req);

    if (req.method === 'GET') {
      requireRole(identity, 'editor');
      json(res, 200, { item: await getImage(id) });
      return;
    }

    if (req.method === 'PATCH') {
      requireRole(identity, 'editor');
      const updates = imageUpdates(await readJsonBody(req));
      const response = await requestAsService(`/rest/v1/gallery_images?id=eq.${id}&select=id,image_url,caption,sender_name,status,created_at,updated_at,width,height,blurhash`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(updates)
      });
      const [row] = await response.json();
      if (!row) {
        throw new ApiError(404, 'IMAGE_NOT_FOUND', 'The image was not found');
      }
      json(res, 200, { item: image(row) });
      return;
    }

    if (req.method === 'DELETE') {
      requireRole(identity, 'admin');
      const response = await requestAsService(`/rest/v1/gallery_images?id=eq.${id}&deleted_at=is.null&select=id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ status: 'deleted', deleted_at: new Date().toISOString() })
      });
      const deleted = await response.json();
      if (!deleted.length) {
        throw new ApiError(404, 'IMAGE_NOT_FOUND', 'The image was not found');
      }
      json(res, 200, { ok: true });
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    sendApiError(res, error);
  }
};
