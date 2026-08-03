"use client";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import classNames from "classnames";
import * as React from "react";
import type { IconButtonProps } from "./icon-button.js";
import { ButtonLike } from "./internal/button-like.js";
import { type TooltipProps, Tooltip } from "./tooltip.js";

export interface InfoTooltipProps extends Omit<
  TooltipProps,
  "children" | "open" | "defaultOpen" | "onOpenChange" | "content"
> {
  content: React.ReactNode;
  children?: React.ReactNode;
  label?: string;
  color?: IconButtonProps["color"] | "unset";
}

const InfoTooltip = React.forwardRef<HTMLSpanElement, InfoTooltipProps>(
  (
    { content, children, label = "More information", className, color = "gray", ...tooltipProps },
    forwardedRef,
  ) => {
    const [open, setOpen] = React.useState(false);

    return (
      <Tooltip content={content} open={open} onOpenChange={setOpen} {...tooltipProps}>
        <ButtonLike
          ref={forwardedRef}
          aria-label={label}
          onKeyboardSimulatedClick={(event) => {
            event.stopPropagation();
            setOpen((prev) => !prev);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              event.stopPropagation();
              setOpen(false);
            }
          }}
          className={classNames(className, "InfoTooltip", {
            gray: color === "gray",
            purple: color === "purple",
            green: color === "green",
            red: color === "red",
          })}
        >
          {children ?? <InfoCircledIcon aria-hidden height={16} width={16} />}
        </ButtonLike>
      </Tooltip>
    );
  },
);

InfoTooltip.displayName = "InfoTooltip";

export { InfoTooltip };
