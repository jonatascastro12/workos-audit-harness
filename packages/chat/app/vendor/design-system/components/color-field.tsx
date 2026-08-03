"use client";

import { composeRefs } from "radix-ui/internal";
import * as React from "react";
import { useIsomorphicLayoutEffect } from "../helpers/use-isomorphic-layout-effect.js";
import * as TextField from "./text-field.js";

interface ColorFieldProps extends React.ComponentPropsWithoutRef<typeof TextField.Root> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const DEFAULT_COLOR = "000000";

const ColorField = React.forwardRef<HTMLInputElement, ColorFieldProps>(
  (
    {
      defaultValue = DEFAULT_COLOR,
      value,
      onChange,
      onBlur,
      onValueChange,
      onKeyDownCapture,
      placeholder = "Hex color",
      size,
      state,
      disabled,
      readOnly,
      ...props
    },
    forwardedRef,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = React.useState(
      parseHex(value ?? defaultValue) ?? DEFAULT_COLOR,
    );

    const committedColorRef = React.useRef(inputValue);
    const preventInputSelectionRef = React.useRef(false);

    const color = React.useMemo(() => {
      const hex = parseHex(inputValue);
      return hex ? hex : committedColorRef.current;
    }, [inputValue]);

    // Sync with the incoming value
    useIsomorphicLayoutEffect(() => {
      const hex = parseHex(value);

      if (hex) {
        setInputValue(hex);
        committedColorRef.current = hex;
      }
    }, [value]);

    return (
      <div
        className="ColorFieldRoot"
        onMouseUp={() => {
          if (preventInputSelectionRef.current) {
            return;
          }

          const inputHasFocus = document.activeElement === inputRef.current;

          if (inputHasFocus && !hasSelection(inputRef.current)) {
            inputRef.current?.select();

            // Don't re-select the input value on next mouse up until blurred
            preventInputSelectionRef.current = true;
          }
        }}
      >
        <TextField.Root
          ref={composeRefs(inputRef, forwardedRef)}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          disabled={disabled}
          placeholder={placeholder}
          readOnly={readOnly}
          size={size}
          // TODO remove this when state prop is removed
          state={state}
          type="text"
          value={inputValue}
          variant="surface"
          onBlur={(event) => {
            committedColorRef.current = color;
            preventInputSelectionRef.current = false;
            setInputValue(color);
            onValueChange?.(formatHex(color));

            // Firefox doesn't really reset input selection range on blur, and then
            // recovers it on focus, which messes with our selection on mouse up.
            if (navigator.userAgent.toLowerCase().includes("firefox")) {
              inputRef.current?.setSelectionRange(0, 0);
            }

            onBlur?.(event);
          }}
          onChange={(event) => {
            setInputValue(event.currentTarget.value);
            onChange?.(event);
          }}
          onKeyDownCapture={(event) => {
            if (event.key === "Enter") {
              if (committedColorRef.current !== inputValue) {
                committedColorRef.current = color;
                setInputValue(color);
                onValueChange?.(formatHex(color));
                setTimeout(() => inputRef.current?.select());

                // Prevent form submission
                // We want the user to see the parsed hex first
                event.preventDefault();
              }
            }

            if (event.key === "Escape") {
              if (committedColorRef.current !== inputValue) {
                setInputValue(committedColorRef.current);
                setTimeout(() => inputRef.current?.select());

                // Prevent dialogs from closing
                // We want the user to see the parsed hex first
                event.stopPropagation();
              }
            }

            onKeyDownCapture?.(event);
          }}
          {...props}
        >
          <TextField.Slot>
            <div className="ColorFieldSwatchWrapper">
              <input
                className="ColorFieldSwatch"
                tabIndex={-1}
                type="color"
                value={"#" + color}
                disabled={(() => {
                  // TODO remove this when state prop is removed
                  if (state !== undefined) {
                    return state === "disabled" || state === "read-only";
                  }

                  return disabled || readOnly;
                })()}
                onChange={(event) => {
                  const hex = parseHex(event.currentTarget.value);

                  if (hex) {
                    committedColorRef.current = hex;
                    setInputValue(hex);
                    onValueChange?.(formatHex(hex));
                  }

                  onChange?.(event);
                }}
              />
              <div className="ColorFieldSwatchBorder" />
            </div>
          </TextField.Slot>
        </TextField.Root>
      </div>
    );
  },
);

ColorField.displayName = "ColorField";

const hasSelection = (input: HTMLInputElement | null) => {
  if (input) {
    const { selectionStart, selectionEnd } = input;
    return (selectionEnd ?? 0) - (selectionStart ?? 0) > 0;
  }

  return false;
};

const parseHex = (value?: string) => {
  const regexp = /((?:^(?:[0-9]|[a-f]){6})|(?:^(?:[0-9]|[a-f]){1,3}))/i;
  let [hex] = value?.trim().replace(/^#/, "").match(regexp) ?? [];

  if (!hex) {
    return null;
  }

  switch (hex.length) {
    case 1:
      hex = hex.repeat(6);
      break;
    case 2:
      hex = hex.repeat(3);
      break;
    case 3:
      const [r, g, b] = hex.split("");
      hex = `${r}${r}${g}${g}${b}${b}`;
  }

  return hex.toUpperCase();
};

const formatHex = (value: string) => "#" + value;

export { ColorField };
