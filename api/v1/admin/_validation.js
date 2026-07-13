const { ApiError } = require('../_http');

function imageUpdates(body) {
  const updates = {};

  if (body.caption !== undefined) {
    if (typeof body.caption !== 'string') {
      throw new ApiError(400, 'INVALID_CAPTION', 'Caption must be text');
    }

    const caption = body.caption.trim();
    if (caption.length > 1000) {
      throw new ApiError(400, 'INVALID_CAPTION', 'Captions can be up to 1000 characters');
    }
    updates.caption = caption || null;
  }

  if (body.status !== undefined) {
    if (!['published', 'hidden'].includes(body.status)) {
      throw new ApiError(400, 'INVALID_STATUS', 'Status must be published or hidden');
    }
    updates.status = body.status;
  }

  if (!Object.keys(updates).length) {
    throw new ApiError(400, 'NO_VALID_UPDATES', 'No valid updates were provided');
  }

  return updates;
}

function noteContent(body) {
  if (typeof body.content !== 'string') {
    throw new ApiError(400, 'INVALID_NOTE', 'Note content is required');
  }

  const content = body.content.trim();
  if (!content || content.length > 1000) {
    throw new ApiError(400, 'INVALID_NOTE', 'Notes must contain 1 to 1000 characters');
  }

  return content;
}

module.exports = { imageUpdates, noteContent };
