import classNames from "classnames";
import * as React from "react";
import { MarginProps } from "../props.js";
import { Text } from "./text.js";

interface StatusOwnProps {
  color: "gray" | "green" | "yellow" | "red";
  /** When true, the text will use the default color while the indicator remains colored */
  disableTextColor?: boolean;
  /** Element type to render as */
  as?: "span" | "div";
  /** Whether to truncate text with ellipsis */
  truncate?: boolean;
}

export interface StatusProps
  extends StatusOwnProps, Omit<React.ComponentPropsWithoutRef<"span">, "color">, MarginProps {
  children?: React.ReactNode;
}

const Status = React.forwardRef<HTMLSpanElement, StatusProps>(
  ({ as, className, disableTextColor, truncate, ...props }, forwardedRef) => (
    <Text
      ref={forwardedRef}
      as={as}
      className={classNames(className, "Status")}
      data-disable-text-color={disableTextColor || undefined}
      size="2"
      truncate={truncate}
      {...props}
    />
  ),
);

Status.displayName = "Status";

export { Status };
