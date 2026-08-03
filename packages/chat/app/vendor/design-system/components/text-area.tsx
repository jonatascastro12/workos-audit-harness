import { TextArea as ThemesTextArea } from "@radix-ui/themes/dist/esm/components/text-area.js";
import * as React from "react";

interface TextAreaInputOwnProps {
  invalid?: boolean;
  /**
   * @deprecated Different state types now use different props as they are no
   * longer mutually exclusive. Use `disabled`, `readOnly` or `invalid` instead.
   */
  state?: "normal" | "disabled" | "read-only" | "invalid";
}

interface TextAreaInputProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof ThemesTextArea>, "color">,
    TextAreaInputOwnProps {}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaInputProps>(
  (
    { invalid = false, disabled = false, readOnly = false, variant = "surface", state, ...props },
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
      <ThemesTextArea
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
        {...props}
      />
    );
  },
);

TextArea.displayName = "TextArea";

export { TextArea };
