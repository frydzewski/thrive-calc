/**
 * Validation utility functions
 */

/**
 * Validate UUID v4 format
 */
export function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate email format (basic check)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string input by trimming whitespace
 */
export function sanitizeString(input: string | undefined | null): string | undefined {
  if (!input || typeof input !== 'string') {
    return undefined;
  }
  const trimmed = input.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Validate and sanitize a number
 */
export function sanitizeNumber(
  value: unknown,
  options?: {
    min?: number;
    max?: number;
    allowNegative?: boolean;
  }
): number | null {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return null;
  }

  const { min, max, allowNegative = true } = options || {};

  if (!allowNegative && value < 0) {
    return null;
  }

  if (min !== undefined && value < min) {
    return null;
  }

  if (max !== undefined && value > max) {
    return null;
  }

  return value;
}
