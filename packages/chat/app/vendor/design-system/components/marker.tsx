import classNames from "classnames";
import * as React from "react";
import { childrenText } from "../helpers/children-text.js";
import { MarginProps } from "../props.js";
import { Text } from "./text.js";

type TextProps = React.ComponentPropsWithoutRef<typeof Text>;

type MarkerOwnProps = {
  color?: "gray" | "purple" | "blue" | "green" | "yellow" | "red";
  highContrast?: boolean;
  size?: TextProps["size"];
  withIcon?: boolean;
};

interface MarkerProps
  extends Omit<React.ComponentPropsWithRef<"span">, "color">, MarkerOwnProps, MarginProps {}

const Marker = React.forwardRef<HTMLSpanElement, MarkerProps>(
  ({ children, className, highContrast, withIcon, ...props }, forwardedRef) => (
    <Text
      ref={forwardedRef}
      className={classNames(className, "Marker", {
        "high-contrast": highContrast,
      })}
      {...props}
    >
      <span className={classNames("MarkerCircle", { "with-icon": withIcon })}>
        <span className="MarkerContent">{children}</span>
      </span>

      {/* If children contain text, add a hidden dot for SR phrasing and correct copy-paste into rich text editors */}
      {childrenText(children) && <span className="MarkerHidden">. </span>}
    </Text>
  ),
);

Marker.displayName = "Marker";

export { Marker };
