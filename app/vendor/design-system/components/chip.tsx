"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import classNames from "classnames";
import * as React from "react";
import { As } from "../helpers/as.js";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";
import { Slot } from "./slot.js";
import { Tooltip } from "./tooltip.js";

export type ChipColor = "gray" | "blue" | "green" | "red";

type ChipOwnProps = {
  color?: ChipColor;
  ghost?: boolean;
  weight?: "regular" | "bold";
  onRemove?: () => void;
  removeLabel?: string;
};

type ChipProps = As<"span", "button"> & ChipOwnProps & MarginProps;

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>((props, forwardedRef) => {
  const {
    as: Tag = "span",
    color = "blue",
    ghost = false,
    weight = "regular",
    className,
    children,
    onRemove,
    removeLabel = "Remove",
    ...chipProps
  } = extractProps(props, marginPropDefs);
  const isButton = Tag === "button";
  const RemoveButton = isButton ? "span" : "button";
  return (
    <Slot
      ref={forwardedRef}
      data-accent-color={color}
      className={classNames(className, "Chip", {
        gray: color === "gray",
        blue: color === "blue",
        green: color === "green",
        red: color === "red",
        ghost,
        "weight-regular": weight === "regular",
        "weight-bold": weight === "bold",
        "reset-button": isButton,
      })}
      {...chipProps}
    >
      <Tag type={isButton ? "button" : undefined}>
        {children}

        {onRemove && (
          <Tooltip content={removeLabel}>
            <RemoveButton
              aria-label={removeLabel}
              className={classNames("reset-button", "ChipRemove")}
              tabIndex={isButton ? 0 : undefined}
              type={isButton ? undefined : "button"}
              onClick={(event) => {
                if (isButton) {
                  event.stopPropagation();
                }

                onRemove();
              }}
              onKeyDown={
                isButton
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.stopPropagation();
                        onRemove();
                      }
                    }
                  : undefined
              }
            >
              <Cross2Icon />
            </RemoveButton>
          </Tooltip>
        )}
      </Tag>
    </Slot>
  );
});

Chip.displayName = "Chip";

export type { ChipProps };
export { Chip };
