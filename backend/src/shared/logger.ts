import { config } from '../config.js';

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = (config.logLevel as LogLevel) || 'info';

function formatMessage(level: LogLevel, msg: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta !== undefined ? ' ' + JSON.stringify(meta) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${msg}${metaStr}`;
}

export const logger = {
  debug: (msg: string, meta?: unknown) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.debug) console.debug(formatMessage('debug', msg, meta));
  },
  info: (msg: string, meta?: unknown) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.info) console.log(formatMessage('info', msg, meta));
  },
  warn: (msg: string, meta?: unknown) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.warn) console.warn(formatMessage('warn', msg, meta));
  },
  error: (msg: string, meta?: unknown) => {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.error) console.error(formatMessage('error', msg, meta));
  },
};
