/**
 * Convert a value to a proper boolean
 */
function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return Boolean(value);
}

/**
 * Normalize boolean values in objects/arrays
 * Converts string "true"/"false" to actual booleans
 * This prevents "java.lang.String cannot be cast to java.lang.Boolean" errors
 */
export function normalizeBooleans(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeBooleans);
  }

  if (typeof obj === 'object') {
    const normalized: any = {};
    for (const key in obj) {
      const value = obj[key];
      // Check if this is a known boolean field
      const isBooleanField =
        key === 'completed' ||
        key === 'emailVerified' ||
        key === 'isAuthenticated' ||
        key.toLowerCase().includes('verified') ||
        key.toLowerCase().includes('completed') ||
        key.toLowerCase().startsWith('is');

      if (
        isBooleanField &&
        (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number')
      ) {
        normalized[key] = toBoolean(value);
      } else if (typeof value === 'object') {
        normalized[key] = normalizeBooleans(value);
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  }

  return obj;
}
