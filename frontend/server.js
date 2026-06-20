const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const KIOSKE_PORT = parseInt(process.env.KIOSKE_PORT || '3000', 10);
const STAFF_PORT = parseInt(process.env.STAFF_PORT || '3002', 10);
const MONITOR_PORT = parseInt(process.env.MONITOR_PORT || '3003', 10);
const STUDENT_PORT = parseInt(process.env.STUDENT_PORT || '3004', 10);

app.prepare().then(() => {
  createServer((req, res) => {
    req.headers['x-app-area'] = 'kioske';
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(KIOSKE_PORT, (err) => {
    if (err) throw err;
    console.log(`> Kioske (triagem) on http://localhost:${KIOSKE_PORT} → https://kioske.stonemark.pt`);
  });

  createServer((req, res) => {
    req.headers['x-app-area'] = 'staff';
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(STAFF_PORT, (err) => {
    if (err) throw err;
    console.log(`> Staff (backoffice) on http://localhost:${STAFF_PORT} → https://staff.stonemark.pt`);
  });

  createServer((req, res) => {
    req.headers['x-app-area'] = 'monitor';
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(MONITOR_PORT, (err) => {
    if (err) throw err;
    console.log(`> Monitor (TV) on http://localhost:${MONITOR_PORT} → https://monitor.stonemark.pt`);
  });

  createServer((req, res) => {
    req.headers['x-app-area'] = 'student';
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(STUDENT_PORT, (err) => {
    if (err) throw err;
    console.log(`> Student (BYOD) on http://localhost:${STUDENT_PORT} → https://aluno.stonemark.pt`);
  });

  console.log(`> Ready: kioske=${KIOSKE_PORT} staff=${STAFF_PORT} monitor=${MONITOR_PORT} student=${STUDENT_PORT}`);
});
