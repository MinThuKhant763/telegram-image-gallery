const { handleCors, methodNotAllowed, sendApiError } = require('./_http');
const { requireUser } = require('./_auth');
const { requestAsService } = require('./_supabase');
const { getLimit, decodeCursor, encodeCursor, addCursorFilter } = require('./_pagination');
const { note } = require('./_serializers');
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
    await requireUser(req);
    const limit = getLimit(req.query?.limit);
    const cursor = decodeCursor(req.query?.cursor);
    const params = new URLSearchParams({
      select: 'id,content,created_at,updated_at',
      deleted_at: 'is.null',
      order: 'created_at.desc,id.desc',
      limit: String(limit + 1)
    });
    addCursorFilter(params, cursor);

    const response = await requestAsService(`/rest/v1/gallery_notes?${params}`);
    const rows = await response.json();
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);

    json(res, 200, {
      items: items.map(note),
      nextCursor: hasMore ? encodeCursor(items.at(-1)) : null
    });
  } catch (error) {
    sendApiError(res, error);
  }
};
