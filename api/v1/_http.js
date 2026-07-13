const { json } = require('../_utils');

function getAllowedOrigins() {
  return (process.env.MOBILE_CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (!origin) {
    return;
  }

  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = allowedOrigins.length === 0
    ? '*'
    : allowedOrigins.includes(origin)
      ? origin
      : null;

  if (!allowedOrigin) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (allowedOrigin !== '*') {
    res.setHeader('Vary', 'Origin');
  }
}

function handleCors(req, res) {
  applyCorsHeaders(req, res);

  if (req.method !== 'OPTIONS') {
    return false;
  }

  res.statusCode = 204;
  res.end();
  return true;
}

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

module.exports = { ApiError, handleCors, sendError, sendApiError, methodNotAllowed };
