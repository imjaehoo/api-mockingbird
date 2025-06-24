export const MIN_PORT = 1024;
export const MAX_PORT = 65535;

export const HTTP_STATUS = {
  OK: 200,
  INTERNAL_SERVER_ERROR: 500,
  MIN_STATUS: 100,
  MAX_STATUS: 599,
  MIN_CLIENT_ERROR: 400,
  MAX_CLIENT_ERROR: 599,
} as const;

export const DEFAULT_HTTP_STATUS = HTTP_STATUS.OK;

export const DELAY = {
  MIN: 0,
  MAX: 10_000,
} as const;
