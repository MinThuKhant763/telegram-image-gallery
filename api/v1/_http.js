const { json } = require('../_utils');

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function sendError(res, status, code, message) {
  json(res, status, { error: { code, message } });
}

function sendApiError(res, error) {
  if (error instanceof ApiError) {
    sendError(res, error.status, error.code, error.message);
    return;
  }

  console.error('Mobile API error:', error.message);
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

function methodNotAllowed(res) {
  sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
}

module.exports = { ApiError, sendError, sendApiError, methodNotAllowed };
