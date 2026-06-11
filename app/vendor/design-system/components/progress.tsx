"use client";
import { Progress as ThemesProgress } from "@radix-ui/themes/dist/esm/components/progress.js";
import * as React from "react";

type ProgressProps = React.ComponentPropsWithoutRef<typeof ThemesProgress>;

const Progress = React.forwardRef<React.ElementRef<typeof ThemesProgress>, ProgressProps>(
  ({ style, ...props }, forwardedRef) => (
    <ThemesProgress
      ref={forwardedRef}
      color="gray"
      size="1"
      style={{ maxWidth: 250, width: "100%", ...style }}
      {...props}
    />
  ),
);

Progress.displayName = "Progress";

export { Progress };
