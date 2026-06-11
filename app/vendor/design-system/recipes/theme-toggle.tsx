"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { IconButton } from "../components/icon-button.js";
import { Tooltip } from "../components/tooltip.js";

interface ThemeToggleOwnProps {
  theme?: string;
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

interface ThemeToggleProps
  extends
    ThemeToggleOwnProps,
    Omit<React.ComponentPropsWithoutRef<typeof IconButton>, "children"> {}

export const ThemeToggle = ({
  theme = "system",
  onThemeChange,
  onClick,
  ...props
}: ThemeToggleProps) => {
  const [systemTheme, setSystemTheme] = React.useState("system");

  // https://github.com/pacocoursey/next-themes/blob/a385b8d865bbb317ff73a5b6c1319ae566f7d6f1/src/index.tsx#L109
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleMediaQuery = (event: { matches: boolean }) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    // Intentionally use deprecated listener methods to support iOS & old browsers
    media.addListener(handleMediaQuery);
    handleMediaQuery(media);

    return () => media.removeListener(handleMediaQuery);
  }, []);

  return (
    <Tooltip collisionPadding={4} content="Toggle theme">
      <IconButton
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented) {
            return;
          }

          // Set 'system' theme if the next theme matches the system theme
          const resolvedTheme = theme === "system" ? systemTheme : theme;
          const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
          const nextThemeMatchesSystem = nextTheme === systemTheme;
          onThemeChange?.(nextThemeMatchesSystem ? "system" : nextTheme);
        }}
        {...props}
      >
        <MoonIcon className="ThemeToggleMoonIcon" height="16" width="16" />
        <SunIcon className="ThemeToggleSunIcon" height="16" width="16" />
      </IconButton>
    </Tooltip>
  );
};
