import { HTTP_STATUS, MAX_PORT, MIN_PORT } from './constants.js';

export const PORT_SCHEMA = {
  type: 'number' as const,
  description: 'Port number of the target server',
  minimum: MIN_PORT,
  maximum: MAX_PORT,
};

export const HTTP_METHOD_SCHEMA = {
  type: 'string' as const,
  enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const,
  description: 'HTTP method of the endpoint',
};

export const PATH_SCHEMA = {
  type: 'string' as const,
  description: 'URL path of the endpoint',
  pattern: '^/',
};


export const STATUS_CODE_SCHEMA = {
  type: 'number' as const,
  description: 'HTTP status code for the error response',
  minimum: HTTP_STATUS.MIN_CLIENT_ERROR,
  maximum: HTTP_STATUS.MAX_CLIENT_ERROR,
};
