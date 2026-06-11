"use client";

import { Button as ThemesButton } from "@radix-ui/themes/dist/esm/components/button.js";
import classNames from "classnames";
import * as React from "react";
import type { MarginProps } from "../props.js";

type ThemesButtonProps = React.ComponentPropsWithoutRef<typeof ThemesButton>;

interface ButtonOwnProps {
  color?: "gray" | "purple" | "red" | "yellow";
  ghost?: boolean;
  size?: ThemesButtonProps["size"];
  loading?: boolean;
  /**
   * @deprecated Different state types now use different props as they are no
   * longer mutually exclusive. Use `loading` or `disabled` instead. Note that
   * loading buttons will always be force-disabled.
   */
  state?: "normal" | "disabled" | "loading";
  type?: "button" | "submit" | "reset" | null;
}

interface ButtonProps
  extends Omit<ThemesButtonProps, "color" | "variant" | "type">, ButtonOwnProps, MarginProps {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      ghost = false,
      color = "gray",
      loading = false,
      disabled,
      state,
      className,
      onClick,
      type = "button",
      ...props
    },
    forwardedRef,
  ) => {
    if (loading) {
      disabled = true;
    }

    // TODO remove all of this when state prop is removed
    if (state !== undefined) {
      if (state === "loading") {
        loading = true;
        disabled = true;
      } else if (state === "disabled") {
        disabled = true;
        loading = false;
      } else {
        disabled = false;
        loading = false;
      }
    }

    return (
      <ThemesButton
        tabIndex={0}
        ref={forwardedRef}
        aria-disabled={disabled || undefined}
        color={color}
        data-disabled={disabled || undefined}
        data-loading={loading || undefined}
        highContrast={!ghost && color === "gray"}
        type={type === null ? undefined : type}
        className={classNames(className, "Button", {
          "state-loading": loading,
        })}
        variant={(() => {
          if (ghost) {
            return "ghost";
          }

          if (color === "purple" || disabled || loading) {
            return "solid";
          }

          return "surface";
        })()}
        onClick={(event) => {
          const ariaDisabled = event.currentTarget.getAttribute("aria-disabled");

          if (ariaDisabled !== null && ariaDisabled !== "false") {
            // Prevent form submission
            event.preventDefault();
            event.stopPropagation();
            return;
          }

          onClick?.(event);
        }}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
