import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";

interface IconPanelOwnProps {
  size?: "1" | "2" | "3" | "4" | "5" | "6" | null;
  color?: "gray" | "purple";
  variant?: "classic" | "solid" | "surface" | "table";
}
type IconPanelProps = Omit<React.ComponentPropsWithRef<"div">, "color"> &
  MarginProps &
  IconPanelOwnProps;

const IconPanel = React.forwardRef<HTMLDivElement, IconPanelProps>((props, forwardedRef) => {
  const {
    children,
    className,
    variant = "classic",
    size = "3",
    color,
    ...iconPanelProps
  } = extractProps(props, marginPropDefs);
  return (
    <div
      ref={forwardedRef}
      data-accent-color={color}
      className={classNames(className, "IconPanel", {
        "variant-classic": variant === "classic",
        "variant-surface": variant === "surface",
        "variant-solid": variant === "solid",
        "variant-table": variant === "table",
        "size-1": size === "1",
        "size-2": size === "2",
        "size-3": size === "3",
        "size-4": size === "4",
        "size-5": size === "5",
        "size-6": size === "6",
      })}
      {...iconPanelProps}
    >
      <div className="IconPanelChildren">{children}</div>
    </div>
  );
});

IconPanel.displayName = "IconPanel";

export { IconPanel };
