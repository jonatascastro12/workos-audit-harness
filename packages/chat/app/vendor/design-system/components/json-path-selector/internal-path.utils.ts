/**
 * Internal path utilities for JsonPathSelector component.
 * These functions convert between key arrays and internal string representation
 * using a special separator for use in Combobox values and Set membership.
 */

export const PATH_SEPARATOR = ":-:-:";

/**
 * Convert an array of keys to an internal path string.
 * Used internally for Combobox values and Set membership.
 *
 * @example
 * keysToPath(['user', 'name']) // 'user:-:-:name'
 * keysToPath(['items', '0', 'id']) // 'items:-:-:0:-:-:id'
 */
export const keysToPath = (keys: string[]): string => keys.join(PATH_SEPARATOR);

/**
 * Convert an internal path string back to an array of keys.
 *
 * @example
 * pathToKeys('user:-:-:name') // ['user', 'name']
 * pathToKeys('items:-:-:0:-:-:id') // ['items', '0', 'id']
 */
export function pathToKeys(path: string): string[] {
  if (!path) {
    return [];
  }

  return path.split(PATH_SEPARATOR);
}
