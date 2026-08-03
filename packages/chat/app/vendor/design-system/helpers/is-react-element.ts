import * as React from "react";

/**
 * Type guard to check if a React element is a valid component with required props
 * @param element - The React element to check
 * @param requiredProps - Array of required prop keys that must exist on the element
 * @returns True if the element is valid and has all required props
 *
 * @usage isReactElement<{ time: string, children: React.ReactNode }>(element, ['time', 'children']);
 */
export function isReactElement<P extends object>(
  element: unknown,
  requiredProps: readonly (keyof P)[],
): element is React.ReactElement<P> {
  if (!React.isValidElement<P>(element)) {
    return false;
  }

  const props = element.props;
  return requiredProps.every((key) => key in props && props[key] !== undefined);
}
