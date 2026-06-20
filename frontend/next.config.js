module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_STAFF_PORT: process.env.NEXT_PUBLIC_STAFF_PORT || '3002',
    NEXT_PUBLIC_KIOSKE_PORT: process.env.NEXT_PUBLIC_KIOSKE_PORT || '3000',
    NEXT_PUBLIC_MONITOR_PORT: process.env.NEXT_PUBLIC_MONITOR_PORT || '3003',
    NEXT_PUBLIC_STUDENT_PORT: process.env.NEXT_PUBLIC_STUDENT_PORT || '3004',
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