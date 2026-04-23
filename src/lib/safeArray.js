/**
 * safeArray - Ensures a value is always an array.
 * Prevents "L.filter is not a function" crashes when entity
 * API calls return undefined, null, or an unexpected object.
 *
 * @param {*} value - The value to normalize
 * @returns {Array}
 */
export function safeArray(value) {
  if (Array.isArray(value)) return value;
  return [];
}