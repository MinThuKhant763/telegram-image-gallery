const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

loadDotEnv();

const routes = {
  '/api/gallery': require('./api/gallery'),
  '/api/notes': require('./api/notes'),
  '/api/admin-images': require('./api/admin-images'),
  '/api/admin-notes': require('./api/admin-notes'),
  '/api/public-config': require('./api/public-config'),
  '/api/telegram-webhook': require('./api/telegram-webhook')
};

const publicDir = path.join(__dirname, 'public');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    res.setHeader('Content-Type', contentTypes[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const handler = routes[url.pathname];

  req.query = Object.fromEntries(url.searchParams.entries());

  if (handler) {
    handler(req, res);
    return;
  }

  serveStatic(req, res, url.pathname);
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

server.listen(port, host, () => {
  console.log(`Telegram gallery running at http://${host}:${port}`);
});
