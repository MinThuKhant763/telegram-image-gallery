const crypto = require('node:crypto');
const Busboy = require('busboy');
const { handleCors, methodNotAllowed, sendApiError, ApiError } = require('../_http');
const { requireUser, requireRole } = require('../_auth');
const { requestAsService } = require('../_supabase');
const { getLimit, decodeCursor, encodeCursor, addCursorFilter } = require('../_pagination');
const { image } = require('../_serializers');
const { DEFAULT_BUCKET, getEnv, getSupabaseServiceKey, json } = require('../../_utils');

const IMAGE_SELECT = 'id,image_url,caption,sender_name,status,created_at,updated_at,width,height,blurhash';
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function sanitizeText(value, maxLength = 1000) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function normalizeStatus(value) {
  if (!value) return 'published';
  if (value === 'published' || value === 'hidden') return value;
  throw new ApiError(400, 'INVALID_STATUS', 'Status must be published or hidden');
}

function extensionForMimeType(mimeType, filename = '') {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
    return extension === 'jpeg' ? 'jpg' : extension;
  }
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

function parsePositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(400, `INVALID_${fieldName.toUpperCase()}`, `${fieldName} must be a positive integer`);
  }
  return number;
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      reject(new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Use multipart/form-data with an image file'));
      return;
    }

    const fields = {};
    let imageFile = null;
    const busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: MAX_IMAGE_BYTES, fields: 8 } });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, stream, info) => {
      if (name !== 'image') {
        stream.resume();
        return;
      }

      const chunks = [];
      let size = 0;
      const mimeType = (info.mimeType || '').toLowerCase();

      stream.on('data', (chunk) => {
        size += chunk.length;
        chunks.push(chunk);
      });
      stream.on('limit', () => reject(new ApiError(413, 'IMAGE_TOO_LARGE', 'Image must be 12 MB or smaller')));
      stream.on('end', () => {
        imageFile = { bytes: Buffer.concat(chunks), filename: info.filename || 'image', mimeType, size };
      });
    });

    busboy.on('error', reject);
    busboy.on('finish', () => resolve({ fields, imageFile }));
    req.pipe(busboy);
  });
}

async function uploadToSupabase(path, bytes, contentType) {
  const bucket = getEnv('SUPABASE_BUCKET', DEFAULT_BUCKET);
  const serviceKey = getSupabaseServiceKey();
  const response = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': contentType,
      'x-upsert': 'false'
    },
    body: bytes
  });

  if (!response.ok) {
    throw new Error(`Supabase upload failed with ${response.status}: ${await response.text()}`);
  }

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

async function listImages(req, res) {
  const limit = getLimit(req.query?.limit);
  const cursor = decodeCursor(req.query?.cursor);
  const params = new URLSearchParams({
    select: IMAGE_SELECT,
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
}

async function createImage(req, res, identity) {
  const { fields, imageFile } = await parseMultipart(req);
  if (!imageFile?.bytes?.length) {
    throw new ApiError(400, 'IMAGE_REQUIRED', 'Attach an image file in the image field');
  }
  if (!ALLOWED_IMAGE_TYPES.has(imageFile.mimeType)) {
    throw new ApiError(400, 'INVALID_IMAGE_TYPE', 'Image must be JPEG, PNG, WEBP, or GIF');
  }

  const width = parsePositiveInteger(fields.width, 'width');
  const height = parsePositiveInteger(fields.height, 'height');
  const status = normalizeStatus(fields.status);
  const caption = sanitizeText(fields.caption);

  const extension = extensionForMimeType(imageFile.mimeType, imageFile.filename);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const storagePath = `admin/${identity.user.id}/${timestamp}-${crypto.randomUUID()}.${extension}`;
  const imageUrl = await uploadToSupabase(storagePath, imageFile.bytes, imageFile.mimeType);

  const record = {
    image_url: imageUrl,
    storage_path: storagePath,
    caption,
    status,
    created_by: identity.user.id,
    width,
    height,
    mime_type: imageFile.mimeType,
    file_size: imageFile.size
  };

  const response = await requestAsService(`/rest/v1/gallery_images?select=${encodeURIComponent(IMAGE_SELECT)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(record)
  });
  const [row] = await response.json();
  json(res, 201, { item: image(row) });
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) {
    return;
  }

  try {
    const identity = await requireUser(req);
    requireRole(identity, 'editor');

    if (req.method === 'GET') {
      await listImages(req, res);
      return;
    }

    if (req.method === 'POST') {
      await createImage(req, res, identity);
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    sendApiError(res, error);
  }
};
