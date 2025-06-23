import { MAX_PORT, MIN_PORT } from '../constants.js';

export function validatePort(port: unknown): void {
  if (!port || typeof port !== 'number') {
    throw new Error('Port number is required and must be a valid number');
  }
  if (port < MIN_PORT || port > MAX_PORT) {
    throw new Error(`Port must be between ${MIN_PORT} and ${MAX_PORT}`);
  }
}

export function validateMethod(method: unknown): string {
  if (!method || typeof method !== 'string') {
    throw new Error('HTTP method is required and must be a string');
  }
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const upperMethod = method.toUpperCase();
  if (!validMethods.includes(upperMethod)) {
    throw new Error(
      `Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`
    );
  }
  return upperMethod;
}

export function validatePath(path: unknown): string {
  if (!path || typeof path !== 'string') {
    throw new Error('Path is required and must be a string');
  }
  if (!path.startsWith('/')) {
    throw new Error('Path must start with /');
  }
  return path;
}
