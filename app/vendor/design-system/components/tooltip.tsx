import { Tooltip as ThemesTooltip } from "@radix-ui/themes/dist/esm/components/tooltip.js";
import * as React from "react";

export type TooltipProps = React.ComponentPropsWithoutRef<typeof ThemesTooltip>;

const Tooltip = React.forwardRef<React.ElementRef<typeof ThemesTooltip>, TooltipProps>(
  (props, forwardedRef) => <ThemesTooltip ref={forwardedRef} delayDuration={300} {...props} />,
);

Tooltip.displayName = "Tooltip";

export { Tooltip };
