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