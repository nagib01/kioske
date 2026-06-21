const { PORT_DEFAULTS } = require('./config/ports');

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_STAFF_PORT: process.env.NEXT_PUBLIC_STAFF_PORT || String(PORT_DEFAULTS.STAFF_PORT),
    NEXT_PUBLIC_KIOSKE_PORT: process.env.NEXT_PUBLIC_KIOSKE_PORT || String(PORT_DEFAULTS.KIOSKE_PORT),
    NEXT_PUBLIC_MONITOR_PORT: process.env.NEXT_PUBLIC_MONITOR_PORT || String(PORT_DEFAULTS.MONITOR_PORT),
    NEXT_PUBLIC_STUDENT_PORT: process.env.NEXT_PUBLIC_STUDENT_PORT || String(PORT_DEFAULTS.STUDENT_PORT),
  }
};

// Production build: set NODE_ENV=production so Next.js loads .env.production
// Then run: npm run build
// Cloudflare tunnel subdomains (update as needed):
//   api.stonemark.pt        → localhost:3001  (backend)
//   kioske.stonemark.pt     → localhost:3000  (triagem/kiosk)
//   staff.stonemark.pt      → localhost:3002  (backoffice)
//   monitor.stonemark.pt    → localhost:3003  (TV monitor)
//   aluno.stonemark.pt      → localhost:3004  (student portal)