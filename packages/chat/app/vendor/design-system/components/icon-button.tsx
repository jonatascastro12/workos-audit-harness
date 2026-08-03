"use client";

import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";
import { Slot } from "./slot.js";

interface IconButtonOwnProps {
  size?: "1" | "2" | "3";
  color?: "gray" | "purple" | "green" | "red";
  loading?: boolean;
  /**
   * @deprecated Different state types now use different props as they are no
   * longer mutually exclusive. Use `loading` or `disabled` instead. Note that
   * loading buttons will always be force-disabled.
   */
  state?: "normal" | "disabled" | "loading";
  /**
   * By default, the `disabled` prop will use the `aria-disabled` attribute to
   * ensure that content remains focusable and accessible even when in a
   * disabled state. If you are sure you want to disable the button and take
   * measures to ensure its accessibility, you can set this prop to `true` to
   * use the `disabled` attribute instead.
   */
  fullyDisabled?: boolean;
  asChild?: boolean;
  type?: "button" | "submit" | "reset" | null;
}

interface IconButtonProps
  extends
    Omit<React.ComponentPropsWithRef<"button">, "color" | "type">,
    IconButtonOwnProps,
    MarginProps {}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>((props, forwardedRef) => {
  const {
    className,
    color = "gray",
    size = "2",
    state: stateProp,
    disabled: disabledProp = false,
    fullyDisabled = false,
    loading: loadingProp = false,
    onClick,
    asChild,
    type = "button",
    ...iconButtonProps
  } = extractProps(props, marginPropDefs);

  let disabled = disabledProp || fullyDisabled || loadingProp;
  let loading = loadingProp;

  // TODO remove all of this when state prop is removed
  let deprecatedState: IconButtonOwnProps["state"];
  if (stateProp !== undefined) {
    deprecatedState = stateProp;
    if (stateProp === "loading") {
      loading = true;
      disabled = true;
    } else if (stateProp === "disabled") {
      disabled = true;
      loading = false;
    } else {
      disabled = false;
      loading = false;
    }
  } else {
    if (loading) {
      deprecatedState = "loading";
    } else if (disabled) {
      deprecatedState = "disabled";
    } else {
      deprecatedState = "normal";
    }
  }

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      tabIndex={0}
      ref={forwardedRef}
      aria-disabled={(disabled && !fullyDisabled) || undefined}
      data-loading={loading || undefined}
      disabled={fullyDisabled || undefined}
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      type={type!}
      className={classNames(className, "reset-button", "IconButton", {
        // TODO: These should no longer be mutually exclusive. Double check to
        // see if there's any impact by consolidating these classes, fix as
        // needed.
        "state-normal": deprecatedState === "normal",
        "state-disabled": deprecatedState === "disabled",
        "state-loading": deprecatedState === "loading",

        "size-1": size === "1",
        "size-2": size === "2",
        "size-3": size === "3",
        gray: color === "gray",
        purple: color === "purple",
        green: color === "green",
        red: color === "red",
      })}
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
      {...iconButtonProps}
    />
  );
});

IconButton.displayName = "IconButton";

export { IconButton };
export type { IconButtonProps };
