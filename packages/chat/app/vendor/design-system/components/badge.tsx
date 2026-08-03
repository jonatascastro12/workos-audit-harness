import { Badge as ThemesBadge } from "@radix-ui/themes/dist/esm/components/badge.js";
import * as React from "react";
import type { MarginProps } from "../props.js";

type ThemesBadgeProps = React.ComponentPropsWithoutRef<typeof ThemesBadge>;

interface BadgeCommonProps {
  size?: ThemesBadgeProps["size"];
}

interface BadgeLowContrastProps {
  color?: "gray";
  lowContrast: true;
}

interface BadgeColoredProps {
  color?: "gray" | "purple" | "blue" | "green" | "yellow" | "red";
  lowContrast?: false;
}

type BadgeOwnProps = BadgeCommonProps & (BadgeLowContrastProps | BadgeColoredProps);

type BadgeProps = Omit<ThemesBadgeProps, "color" | "highContrast" | "radius" | "variant"> &
  BadgeOwnProps &
  MarginProps;

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ color = "gray", lowContrast = false, ...props }, forwardedRef) => (
    <ThemesBadge
      ref={forwardedRef}
      color={color}
      data-low-contrast={lowContrast || undefined}
      radius="full"
      variant={color === "gray" ? "surface" : "soft"}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps };
