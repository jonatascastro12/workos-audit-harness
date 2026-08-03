"use client";

import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { IconButton } from "../components/icon-button.js";
import { Tooltip } from "../components/tooltip.js";

interface CopyButtonProps extends Omit<
  React.ComponentPropsWithoutRef<typeof IconButton>,
  "children"
> {
  copyLabel?: string;
  height?: number;
  width?: number;
}

export const CopyButton = ({
  onClick,
  copyLabel = "Copy",
  height = 16,
  width = 16,
  ...props
}: CopyButtonProps) => {
  const [copyTimeout, setCopyTimeout] = React.useState<ReturnType<typeof setTimeout>>();
  const [isTooltipForcedOpen, setTooltipForcedOpen] = React.useState<true | undefined>(undefined);

  return (
    <Tooltip content={copyTimeout ? "Copied" : copyLabel} open={isTooltipForcedOpen}>
      <IconButton
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented) {
            return;
          }

          if (copyTimeout) {
            clearTimeout(copyTimeout);
          }

          setCopyTimeout(setTimeout(() => setCopyTimeout(undefined), 2000));
          setTooltipForcedOpen(true);
        }}
        onMouseEnter={() => {
          if (copyTimeout) {
            clearTimeout(copyTimeout);
            setCopyTimeout(undefined);
          }
        }}
        onMouseLeave={() => {
          if (isTooltipForcedOpen) {
            setTooltipForcedOpen(undefined);
          }
        }}
        {...props}
      >
        {copyTimeout ? (
          <CheckIcon height={height} width={width} />
        ) : (
          <CopyIcon height={height} width={width} />
        )}
      </IconButton>
    </Tooltip>
  );
};
