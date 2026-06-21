// Single source of truth for the frontend multi-app ports.
// Consumed by server.js (runtime) and next.config.js (public env fallbacks).
const PORT_DEFAULTS = {
  KIOSKE_PORT: 3000,
  STAFF_PORT: 3002,
  MONITOR_PORT: 3003,
  STUDENT_PORT: 3004,
  LANDING_PORT: 3005,
};

/** Reads a port from the environment, falling back to the shared default. */
function port(name) {
  return parseInt(process.env[name] || String(PORT_DEFAULTS[name]), 10);
}

module.exports = { PORT_DEFAULTS, port };
