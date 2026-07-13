const { methodNotAllowed, sendApiError, sendError, ApiError } = require('./_http');
const { requireUser } = require('./_auth');
const { requestAsService } = require('./_supabase');
const { getLimit, decodeCursor, encodeCursor, addCursorFilter, isUuid } = require('./_pagination');
const { image } = require('./_serializers');
const { json } = require('../_utils');

const IMAGE_SELECT = 'id,image_url,caption,sender_name,status,created_at,updated_at,width,height,blurhash';

async function getGalleryPage(req) {
  const limit = getLimit(req.query?.limit);
  const cursor = decodeCursor(req.query?.cursor);
  const params = new URLSearchParams({
    select: IMAGE_SELECT,
    status: 'eq.published',
    deleted_at: 'is.null',
    order: 'created_at.desc,id.desc',
    limit: String(limit + 1)
  });
  addCursorFilter(params, cursor);

  const response = await requestAsService(`/rest/v1/gallery_images?${params}`);
  const rows = await response.json();
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  return {
    items: items.map(image),
    nextCursor: hasMore ? encodeCursor(items.at(-1)) : null
  };
}

async function getGalleryImage(id) {
  if (!isUuid(id)) {
    throw new ApiError(400, 'INVALID_IMAGE_ID', 'The image id is invalid');
  }

  const params = new URLSearchParams({
    select: IMAGE_SELECT,
    id: `eq.${id}`,
    status: 'eq.published',
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
  if (req.method !== 'GET') {
    methodNotAllowed(res);
    return;
  }

  try {
    await requireUser(req);
    const result = req.query?.id ? { item: await getGalleryImage(req.query.id) } : await getGalleryPage(req);
    json(res, 200, result);
  } catch (error) {
    sendApiError(res, error);
  }
};
