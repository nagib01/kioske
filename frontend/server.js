const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PUBLIC_PORT = parseInt(process.env.PUBLIC_PORT || '3000', 10);
const STAFF_PORT = parseInt(process.env.STAFF_PORT || '3002', 10);

app.prepare().then(() => {
  createServer((req, res) => {
    req.headers['x-app-area'] = 'public';
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PUBLIC_PORT, (err) => {
    if (err) throw err;
    console.log(`> Public app (mobile-first) on http://localhost:${PUBLIC_PORT}`);
  });

  createServer((req, res) => {
    req.headers['x-app-area'] = 'staff';
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(STAFF_PORT, (err) => {
    if (err) throw err;
    console.log(`> Staff app on http://localhost:${STAFF_PORT}`);
  });

  console.log(`> Ready on ports ${PUBLIC_PORT} (public) and ${STAFF_PORT} (staff)`);
});
