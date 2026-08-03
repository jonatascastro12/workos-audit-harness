import * as ThemesTextField from "@radix-ui/themes/dist/esm/components/text-field.js";
import * as React from "react";

interface TextFieldRootOwnProps {
  invalid?: boolean;
  /**
   * @deprecated Different state types now use different props as they are no
   * longer mutually exclusive. Use `disabled`, `readOnly` or `invalid` instead.
   */
  state?: "normal" | "disabled" | "read-only" | "invalid";
  suppressPasswordManagers?: boolean;
}

interface TextFieldRootProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof ThemesTextField.Root>, "color" | "radius">,
    TextFieldRootOwnProps {}

const TextFieldRoot = React.forwardRef<HTMLInputElement, TextFieldRootProps>(
  (
    {
      invalid = false,
      disabled = false,
      readOnly = false,
      variant = "surface",
      state,
      suppressPasswordManagers = false,
      ...props
    },
    forwardedRef,
  ) => {
    // TODO remove all of this when state prop is removed
    if (state !== undefined) {
      if (state === "read-only") {
        readOnly = true;
        disabled = false;
        invalid = false;
      } else if (state === "disabled") {
        readOnly = false;
        disabled = true;
        invalid = false;
      } else if (state === "invalid") {
        readOnly = false;
        disabled = false;
        invalid = true;
      } else {
        readOnly = false;
        disabled = false;
        invalid = false;
      }
    }

    return (
      <ThemesTextField.Root
        ref={forwardedRef}
        aria-invalid={invalid ?? undefined}
        disabled={disabled ?? undefined}
        readOnly={readOnly ?? undefined}
        variant={variant}
        color={(() => {
          if (invalid) {
            return "red";
          }

          if (variant === "soft") {
            return "gray";
          }

          return undefined;
        })()}
        {...(suppressPasswordManagers
          ? {
              "data-1p-ignore": "true",
              "data-lpignore": "true",
              "data-protonpass-ignore": "true",
              "data-bwignore": "true",
            }
          : null)}
        {...props}
      />
    );
  },
);

TextFieldRoot.displayName = "TextFieldRoot";

export const Root = TextFieldRoot;
export const Slot = ThemesTextField.Slot;
