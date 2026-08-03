import { Theme as ThemeProvider } from "@radix-ui/themes/dist/esm/components/theme.js";
import classNames from "classnames";
import * as React from "react";

interface ThemeProps extends React.ComponentPropsWithoutRef<typeof ThemeProvider> {
  branded?: boolean;
}

const Theme = React.forwardRef<React.ElementRef<typeof ThemeProvider>, ThemeProps>(
  ({ branded, className, ...props }, forwardedRef) => (
    <ThemeProvider
      ref={forwardedRef}
      accentColor={branded ? "gray" : "purple"}
      className={classNames(className, { branded })}
      grayColor={branded ? "gray" : "slate"}
      radius="medium"
      {...props}
    />
  ),
);

Theme.displayName = "DesignSystemTheme";

export { Theme };
