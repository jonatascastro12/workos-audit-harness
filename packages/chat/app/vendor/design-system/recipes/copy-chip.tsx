"use client";

import { composeRefs } from "radix-ui/internal";
import * as React from "react";
import { Chip } from "../components/chip.js";
import { Tooltip } from "../components/tooltip.js";

type CopyChipProps = Omit<React.ComponentPropsWithoutRef<typeof Chip>, "as">;

export const CopyChip = React.forwardRef<HTMLButtonElement, CopyChipProps>(
  ({ children, onClick, ...props }, forwardedRef) => {
    const chipRef = React.useRef<HTMLButtonElement>(null);

    const [state, setState] = React.useReducer(
      (prevState, newState) => {
        // Start a timeout to change the text when tooltip is closed
        if (newState.open === false) {
          newState.timeout = setTimeout(() => {
            setState({
              text: "Click to copy",
              timeout: null,
            });
          }, 1000);
        }

        // Clear a previous timeout when tooltip state changes
        if (prevState.timeout) {
          clearTimeout(prevState.timeout);
          prevState.timeout = null;
        }

        return { ...prevState, ...newState };
      },
      {
        open: false,
        text: "Click to copy",
        timeout: null,
      },
    );

    return (
      <Tooltip
        content={state.text}
        open={state.open}
        onOpenChange={(open) => setState({ open })}
        onPointerDownOutside={(event) => {
          // Prevent tooltip closing on click
          // Introducing lint rule banning type assertions
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const target = event.target as HTMLElement;
          if (chipRef.current?.contains(target)) {
            event.preventDefault();
          }
        }}
      >
        <Chip
          {...props}
          ref={composeRefs(chipRef, forwardedRef)}
          as="button"
          onClick={async (event) => {
            onClick?.(event);
            const originalDefaultPrevented = event.defaultPrevented;

            // Prevent tooltip closing on click
            event.preventDefault();
            const text = chipRef.current?.textContent;

            if (text) {
              setState({
                open: true,
                text: "Copied",
              });

              if (!originalDefaultPrevented) {
                await navigator.clipboard.writeText(text);
              }
            }
          }}
        >
          {children}
        </Chip>
      </Tooltip>
    );
  },
);

CopyChip.displayName = "CopyChip";
