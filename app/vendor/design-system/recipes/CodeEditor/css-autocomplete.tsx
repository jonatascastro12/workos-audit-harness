import { autocompletion, Completion, CompletionContext } from "@codemirror/autocomplete";
import { Extension } from "@codemirror/state";
import cssProperties from "../../generated/css-properties.json";

export interface CSSAutocompleteOptions {
  /** Predefined CSS class names to suggest */
  classNames?: string[];
  /** CSS custom properties (variables) to suggest when using var() */
  cssVariables?: string[];
  /** CSS property suggestions */
  cssProperties?: string[];
  /** CSS property values for specific properties */
  cssPropertyValues?: Record<string, string[]>;
}

/**
 * Creates a CSS autocompletion extension that provides suggestions for:
 * - CSS class names (when typing after a dot)
 * - CSS variables (when typing inside var())
 * - CSS property names (when typing after a colon)
 * - CSS property values (when typing after a colon and a space)
 */
export function cssAutocomplete(options: CSSAutocompleteOptions = {}): Extension {
  const {
    classNames = [],
    cssVariables = [],
    cssPropertyValues = DEFAULT_CSS_PROPERTY_VALUES,
  } = options;

  const cssPropertyNames = Object.keys(cssPropertyValues);

  return autocompletion({
    activateOnTyping: true,
    override: [
      (context: CompletionContext) => {
        const { state, pos } = context;
        const line = state.doc.lineAt(pos);
        const lineText = line.text;
        const linePos = pos - line.from;

        // Get text before cursor position
        const textBeforeCursor = lineText.slice(0, linePos);

        // Check if this is an explicit completion request (manual trigger)
        const isExplicit = context.explicit;

        // Check if we're typing a CSS class (after a dot)
        const classMatch = textBeforeCursor.match(/\.([a-zA-Z-_]*)$/);
        if (classMatch) {
          // Only show class completions if the dot is at the beginning of the line (with optional whitespace)
          const beforeDot = textBeforeCursor.slice(0, -classMatch[0].length);
          const isAtLineStart = beforeDot.trim() === "";
          if (!isAtLineStart) {
            return null;
          }

          const typed = classMatch[1] || "";
          const completions: Completion[] = classNames
            .filter((className) => className.toLowerCase().includes(typed.toLowerCase()))
            .map((className) => ({
              label: className,
              type: "class",
              info: `CSS class: .${className}`,
              detail: "CSS class",
              boost: className.toLowerCase().startsWith(typed.toLowerCase()) ? 1 : 0,
            }));

          if (completions.length > 0) {
            return {
              from: pos - typed.length,
              options: completions,
              validFor: /^[a-zA-Z-_]*$/,
            };
          }
        }

        // Check if we're inside var() function
        const varMatch = textBeforeCursor.match(/var\(\s*([^)]*?)$/);
        if (varMatch) {
          // Only show var() completions when explicitly requested
          if (!isExplicit) {
            return null;
          }

          const typed = varMatch[1] || "";
          const completions: Completion[] = cssVariables
            .filter((variable) => variable.toLowerCase().includes(typed.toLowerCase()))
            .map((variable) => ({
              label: variable,
              type: "variable",
              info: `CSS variable: ${variable}`,
              detail: "CSS custom property",
              boost: variable.toLowerCase().startsWith(typed.toLowerCase()) ? 1 : 0,
            }));

          if (completions.length > 0) {
            return {
              from: pos - typed.length,
              options: completions,
              validFor: /^[a-zA-Z-_0-9]*$/,
            };
          }
        }

        // Check if we're typing var( to suggest the function itself
        const varFuncMatch = textBeforeCursor.match(/var$/);
        if (varFuncMatch && cssVariables.length > 0) {
          // Only show var() function when explicitly requested
          if (!isExplicit) {
            return null;
          }

          return {
            from: pos - 3,
            options: [
              {
                label: "var()",
                type: "function",
                info: "CSS var() function for custom properties",
                detail: "CSS function",
                apply: (view, _completion, from, to) => {
                  const insert = "var()";
                  view.dispatch({
                    changes: { from, to, insert },
                    selection: { anchor: from + insert.length - 1 }, // Position cursor before closing )
                  });
                },
              },
            ],
          };
        }

        // Check if we're typing a CSS property (at the beginning of a line or after opening brace)
        const propertyMatch = textBeforeCursor.match(/(?:^|\{)\s*([a-zA-Z-]*)$/);
        if (propertyMatch) {
          // Only show CSS properties when explicitly requested
          if (!isExplicit) {
            return null;
          }

          const typed = propertyMatch[1] || "";
          const completions: Completion[] = cssPropertyNames
            .filter((property) => property.toLowerCase().includes(typed.toLowerCase()))
            .map((property) => ({
              label: property,
              type: "property",
              info: `CSS property: ${property}`,
              detail: "CSS property",
              apply: `${property}: `,
              boost: property.toLowerCase().startsWith(typed.toLowerCase()) ? 1 : 0,
            }));

          if (completions.length > 0) {
            return {
              from: pos - typed.length,
              options: completions,
              validFor: /^[a-zA-Z-]*$/,
            };
          }
        }

        // Check if we're typing a CSS property value (after a colon)
        const valueMatch = textBeforeCursor.match(/([a-zA-Z-]+):\s*([^;}]*)$/);
        if (valueMatch) {
          // Only show CSS property values when explicitly requested
          if (!isExplicit) {
            return null;
          }

          const property = valueMatch[1];
          const typed = valueMatch[2] || "";
          const values = property ? cssPropertyValues[property] || [] : [];

          if (values.length > 0) {
            const completions: Completion[] = values
              .filter((value: string) => value.toLowerCase().includes(typed.toLowerCase()))
              .map((value: string) => {
                // Check if this is a CSS function (ends with parentheses)
                const isFunction = value.endsWith("()");

                return {
                  label: value,
                  type: isFunction ? "function" : "value",
                  info: `CSS ${isFunction ? "function" : "value"} for ${property}: ${value}`,
                  detail: isFunction ? "CSS function" : "CSS value",
                  // For functions, position cursor inside parentheses
                  apply: isFunction
                    ? (view, _completion, from, to) => {
                        const insert = value;
                        view.dispatch({
                          changes: { from, to, insert },
                          selection: { anchor: from + insert.length - 1 }, // Position cursor before closing )
                        });
                      }
                    : value,
                  boost: value.toLowerCase().startsWith(typed.toLowerCase()) ? 1 : 0,
                };
              });

            if (completions.length > 0) {
              return {
                from: pos - typed.length,
                options: completions,
                validFor: /^[a-zA-Z-0-9%().,\s]*$/,
              };
            }
          }
        }

        return null;
      },
    ],
  });
}

/**
 * Common CSS property values
 */
export const DEFAULT_CSS_PROPERTY_VALUES: Record<string, string[]> = cssProperties;
