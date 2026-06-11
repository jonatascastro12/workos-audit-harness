"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { FlexProps } from "@radix-ui/themes/dist/esm/components/flex.js";
import { Slottable } from "@radix-ui/themes/dist/esm/components/slot.js";
import classNames from "classnames";
import { composeRefs, RovingFocus, useComposedRefs } from "radix-ui/internal";
import * as React from "react";
import { getTabbableNodes } from "../helpers/get-tabbable-nodes.js";
import { Flex, Slot, Text } from "../index.js";

type ListCellRootProps = FlexProps & {
  size?: "1" | "2" | "3";
};

const ListCellRoot = React.forwardRef<HTMLDivElement, ListCellRootProps>(function ListCellRoot(
  { children, size = "1", ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  return (
    <RovingFocus.Root asChild dir="ltr" loop={false} orientation="vertical">
      <Flex
        ref={composeRefs(ref, forwardedRef)}
        className={classNames("ListCellRoot", `size-${size}`)}
        direction="column"
        {...props}
      >
        {children}
      </Flex>
    </RovingFocus.Root>
  );
});

interface ListCellItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  asChild?: boolean;
  lowContrast?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
}

const ListCellItem = React.forwardRef<HTMLDivElement, ListCellItemProps>(function ListCellItem(
  {
    children,
    lowContrast,
    onBlur,
    onClick,
    onFocus,
    onKeyDown,
    asChild,
    title,
    description,
    ...props
  },
  forwardedRef,
) {
  const itemRef = React.useRef<HTMLTableRowElement>(null);
  const composedRef = useComposedRefs(itemRef, forwardedRef);
  const Component = asChild ? Slot : "div";

  const tabbableNodes = React.useRef<
    {
      element: HTMLElement;
      originalTabIndex: string | null;
    }[]
  >([]);

  const handleNodeKeyDown = React.useCallback((event: KeyboardEvent) => {
    if (!itemRef.current) {
      return;
    }

    const currentNodeIndex = tabbableNodes.current.findIndex(
      ({ element }) => element === event.currentTarget,
    );

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusIfPossible(itemRef.current.previousElementSibling || itemRef.current);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusIfPossible(itemRef.current.nextElementSibling || itemRef.current);
    } else if (event.key === "PageUp" || event.key === "Home") {
      focusIfPossible(itemRef.current.parentNode?.firstElementChild);
    } else if (event.key === "PageDown" || event.key === "End") {
      focusIfPossible(itemRef.current.parentNode?.lastElementChild);
    } else if (event.key === "ArrowLeft") {
      if (
        focusIfPossible(tabbableNodes.current[currentNodeIndex - 1]?.element || itemRef.current)
      ) {
        event.preventDefault();
      }
    } else if (event.key === "ArrowRight") {
      if (
        focusIfPossible(tabbableNodes.current[currentNodeIndex + 1]?.element || itemRef.current)
      ) {
        event.preventDefault();
      }
    }

    if (event.key === "Tab" && itemRef.current) {
      const nextElementToFocus =
        tabbableNodes.current[event.shiftKey ? currentNodeIndex - 1 : currentNodeIndex + 1]
          ?.element;

      if (focusIfPossible(nextElementToFocus)) {
        event.preventDefault();
      }
    }
  }, []);

  const removeChildrenTabIndices = React.useCallback(() => {
    if (itemRef.current) {
      const nodes = getTabbableNodes(itemRef.current);

      tabbableNodes.current = nodes.map((node) => ({
        element: node,
        originalTabIndex: node.getAttribute("tabindex"),
      }));

      nodes.forEach((node) => {
        node.setAttribute("tabindex", "-1");
        node.removeEventListener("keydown", handleNodeKeyDown);
      });
    }
  }, [handleNodeKeyDown]);

  const restoreChildrenTabIndices = React.useCallback(() => {
    tabbableNodes.current.forEach(({ element, originalTabIndex }) => {
      if (originalTabIndex === null) {
        element.removeAttribute("tabindex");
      } else {
        element.setAttribute("tabindex", originalTabIndex);
      }

      element.addEventListener("keydown", handleNodeKeyDown);
    });
  }, [handleNodeKeyDown]);

  React.useEffect(() => {
    removeChildrenTabIndices();
    // Make sure we start from a clean state
    return restoreChildrenTabIndices;
  }, [removeChildrenTabIndices, restoreChildrenTabIndices]);

  return (
    <RovingFocus.Item asChild>
      <Text asChild size="2">
        <Component
          ref={composedRef}
          className={classNames(props.className, "ListCellItem", lowContrast && "lowContrast")}
          onBlur={(event) => {
            onBlur?.(event);

            if (!event.currentTarget.contains(document.activeElement)) {
              removeChildrenTabIndices();
            }
          }}
          onClick={(event) => {
            onClick?.(event);
          }}
          onFocus={(event) => {
            restoreChildrenTabIndices();
            onFocus?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);

            if (event.defaultPrevented) {
              return;
            }

            if (!tabbableNodes.current || tabbableNodes.current.length === 0) {
              return;
            }

            if (event.target !== itemRef.current) {
              return;
            }

            if (event.key === "ArrowRight") {
              focusIfPossible(tabbableNodes.current.at(0)?.element);
            } else if (event.key === "ArrowLeft") {
              focusIfPossible(tabbableNodes.current.at(-1)?.element);
            }
          }}
          {...props}
        >
          <Slottable>{children}</Slottable>

          <Flex direction="column" flexGrow="1" gap="2" minWidth="0">
            <Text align="left" as="div" className="ListCellItemTitle" trim="both">
              <Text truncate as="div" style={{ display: "block" }}>
                {title}
              </Text>
            </Text>

            {description && (
              <Text className="ListCellItemDescription" trim="both">
                {description}
              </Text>
            )}
          </Flex>

          <ChevronRightIcon className="ListCellItemChevron" />
        </Component>
      </Text>
    </RovingFocus.Item>
  );
});

interface ListCellItemSlotProps extends React.ComponentPropsWithoutRef<"div"> {
  side?: "left" | "right";
}

const ListCellItemSlot = React.forwardRef<HTMLDivElement, ListCellItemSlotProps>(
  function ListCellItemSlot({ side = "left", ...props }, forwardedRef) {
    return <div ref={forwardedRef} className={classNames("ListCellItemSlot", side)} {...props} />;
  },
);

const focusIfPossible = (element?: ChildNode | null) => {
  if (element && element instanceof HTMLElement) {
    element.focus();
    return true;
  }

  return false;
};

export { ListCellItem as Item, ListCellItemSlot as ItemSlot, ListCellRoot as Root };
