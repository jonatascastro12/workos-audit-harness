"use client";

import classNames from "classnames";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { composeRefs } from "radix-ui/internal";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";

interface ScrollAreaRootProps
  extends React.ComponentPropsWithRef<typeof ScrollAreaPrimitive.Root>, MarginProps {}

const ScrollAreaRoot = React.forwardRef<HTMLDivElement, ScrollAreaRootProps>(
  (props, forwardedRef) => {
    const { className, ...rootProps } = extractProps(props, marginPropDefs);
    return (
      <ScrollAreaPrimitive.Root
        ref={forwardedRef}
        className={classNames(className, "ScrollAreaRoot")}
        scrollHideDelay={0}
        {...rootProps}
      />
    );
  },
);

ScrollAreaRoot.displayName = "ScrollAreaRoot";

export interface ScrollAreaViewportProps
  extends React.ComponentPropsWithRef<typeof ScrollAreaPrimitive.Viewport>, MarginProps {
  indicators?: "left" | "right" | "top" | "bottom" | "y" | "x" | "all" | "none";
}

const ScrollAreaViewport = React.forwardRef<HTMLDivElement, ScrollAreaViewportProps>(
  ({ indicators = "none", ...props }, forwardedRef) => {
    const { className, ...viewportProps } = extractProps(props, marginPropDefs);
    const viewportRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (indicators === "none") {
        return;
      }

      // If the browser supports the animation-timeline property
      // There is no need for the JS fallback
      const supports = CSS.supports("animation-timeline: scroll()");
      if (supports) {
        return;
      }

      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      let showTop = false;
      let showBottom = false;
      let showLeft = false;
      let showRight = false;

      const topIndicators = ["all", "y", "top"];
      const bottomIndicators = ["all", "y", "bottom"];
      const leftIndicators = ["all", "x", "left"];
      const rightIndicators = ["all", "x", "right"];

      function handleCheckIndicators() {
        if (!viewport) {
          return;
        }

        const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } =
          viewport;
        const shouldShowTop = scrollTop > 0 && topIndicators.includes(indicators);
        const shouldShowBottom =
          scrollTop < Math.ceil(scrollHeight - clientHeight) &&
          bottomIndicators.includes(indicators);
        const shouldShowLeft = scrollLeft > 0 && leftIndicators.includes(indicators);
        const shouldShowRight =
          scrollLeft < Math.ceil(scrollWidth - clientWidth) && rightIndicators.includes(indicators);

        if (shouldShowTop !== showTop) {
          showTop = shouldShowTop;
          viewport.style.setProperty(
            "--scroll-area-top-indicator-opacity",
            shouldShowTop ? "100%" : "0%",
          );
        }

        if (shouldShowBottom !== showBottom) {
          showBottom = shouldShowBottom;
          viewport.style.setProperty(
            "--scroll-area-bottom-indicator-opacity",
            shouldShowBottom ? "100%" : "0%",
          );
        }

        if (shouldShowLeft !== showLeft) {
          showLeft = shouldShowLeft;
          viewport.style.setProperty(
            "--scroll-area-left-indicator-opacity",
            shouldShowLeft ? "100%" : "0%",
          );
        }

        if (shouldShowRight !== showRight) {
          showRight = shouldShowRight;
          viewport.style.setProperty(
            "--scroll-area-right-indicator-opacity",
            shouldShowRight ? "100%" : "0%",
          );
        }
      }

      const resizeObserver = new ResizeObserver(handleCheckIndicators);

      viewport.addEventListener("scroll", handleCheckIndicators);
      resizeObserver.observe(viewport);

      return () => {
        viewport.removeEventListener("scroll", handleCheckIndicators);
        resizeObserver.disconnect();
      };
    }, [indicators]);

    return (
      <>
        <ScrollAreaPrimitive.Viewport
          ref={composeRefs(forwardedRef, viewportRef)}
          className={classNames(className, "ScrollAreaViewport")}
          data-scroll-indicators={indicators !== "none" ? indicators : undefined}
          {...viewportProps}
        />
        <div className="ScrollAreaViewportFocusRing" />
      </>
    );
  },
);

ScrollAreaViewport.displayName = "ScrollAreaViewport";

interface ScrollAreaScrollbarProps
  extends React.ComponentPropsWithRef<typeof ScrollAreaPrimitive.Scrollbar>, MarginProps {}

const ScrollAreaScrollbar = React.forwardRef<HTMLDivElement, ScrollAreaScrollbarProps>(
  (props, forwardedRef) => {
    const { className, ...scrollbarProps } = extractProps(props, marginPropDefs);
    return (
      <ScrollAreaPrimitive.Scrollbar
        ref={forwardedRef}
        className={classNames(className, "ScrollAreaTrack")}
        {...scrollbarProps}
      >
        <ScrollAreaPrimitive.Thumb className="ScrollAreaThumb" />
      </ScrollAreaPrimitive.Scrollbar>
    );
  },
);

ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar";

export const Root = ScrollAreaRoot;
export const Viewport = ScrollAreaViewport;
export const Scrollbar = ScrollAreaScrollbar;
