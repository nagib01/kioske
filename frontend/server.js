const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { port } = require('./config/ports');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const KIOSKE_PORT = port('KIOSKE_PORT');
const STAFF_PORT = port('STAFF_PORT');
const MONITOR_PORT = port('MONITOR_PORT');
const STUDENT_PORT = port('STUDENT_PORT');
const LANDING_PORT = port('LANDING_PORT');

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

  createServer((req, res) => {
    req.headers['x-app-area'] = 'landing';
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(LANDING_PORT, (err) => {
    if (err) throw err;
    console.log(`> Landing on http://localhost:${LANDING_PORT} → https://www.stonemark.pt`);
  });

  console.log(`> Ready: kioske=${KIOSKE_PORT} staff=${STAFF_PORT} monitor=${MONITOR_PORT} student=${STUDENT_PORT} landing=${LANDING_PORT}`);
});
