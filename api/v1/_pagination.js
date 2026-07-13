const { ApiError } = require('./_http');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getLimit(value, fallback = 30) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), 50);
}

function decodeCursor(cursor) {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const createdAt = new Date(parsed.createdAt);

    if (!UUID_PATTERN.test(parsed.id) || Number.isNaN(createdAt.valueOf())) {
      throw new Error('Invalid cursor payload');
    }

    return { id: parsed.id, createdAt: createdAt.toISOString() };
  } catch {
    throw new ApiError(400, 'INVALID_CURSOR', 'The pagination cursor is invalid');
  }
}

function encodeCursor(item) {
  return Buffer.from(JSON.stringify({ id: item.id, createdAt: item.created_at })).toString('base64url');
}

function addCursorFilter(params, cursor) {
  if (!cursor) {
    return;
  }

  params.set(
    'or',
    `(created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id}))`
  );
}

function isUuid(value) {
  return UUID_PATTERN.test(value || '');
}

module.exports = { getLimit, decodeCursor, encodeCursor, addCursorFilter, isUuid };
