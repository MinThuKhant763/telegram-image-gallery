const { handleCors, methodNotAllowed, sendApiError } = require('../_http');
const { requireUser, requireRole } = require('../_auth');
const { requestAsService } = require('../_supabase');
const { getLimit, decodeCursor, encodeCursor, addCursorFilter } = require('../_pagination');
const { image } = require('../_serializers');
const { json } = require('../../_utils');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    methodNotAllowed(res);
    return;
  }

  try {
    const identity = await requireUser(req);
    requireRole(identity, 'editor');

    const limit = getLimit(req.query?.limit);
    const cursor = decodeCursor(req.query?.cursor);
    const params = new URLSearchParams({
      select: 'id,image_url,caption,sender_name,status,created_at,updated_at,width,height,blurhash',
      deleted_at: 'is.null',
      order: 'created_at.desc,id.desc',
      limit: String(limit + 1)
    });
    addCursorFilter(params, cursor);

    const response = await requestAsService(`/rest/v1/gallery_images?${params}`);
    const rows = await response.json();
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);

    json(res, 200, {
      items: items.map(image),
      nextCursor: hasMore ? encodeCursor(items.at(-1)) : null
    });
  } catch (error) {
    sendApiError(res, error);
  }
};
