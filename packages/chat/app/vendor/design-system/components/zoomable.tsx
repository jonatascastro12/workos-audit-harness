"use client";

import { Theme } from "@radix-ui/themes/dist/esm/components/theme.js";
import classNames from "classnames";
import { Dialog } from "radix-ui";
import * as React from "react";
import { flushSync } from "react-dom";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";
import { VisuallyHidden } from "./visually-hidden.js";

type ZoomStatus = "closed" | "closing" | "opening" | "open" | "fading-out";

interface ImageSize {
  width: number;
  height: number;
}

interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  opacity: number;
}

interface ZoomableProps extends MarginProps {
  className?: string;
  title?: string;
  children: React.ReactElement<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
  >;
}

const Zoomable = (props: ZoomableProps) => {
  const { children, className, style } = extractProps(props, marginPropDefs);
  const [isMobile, setIsMobile] = React.useState(true);
  const [status, setStatus] = React.useState<ZoomStatus>("closed");
  const [transform, setTransform] = React.useState<Transform>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    opacity: 0,
    scale: 1,
  });
  const safeMargin = 20;
  const maxWidth = 1500;
  const maxHeight = 1500;
  const minScale = 1.5;
  const childRef = React.useRef<HTMLElement | null>(null);
  const windowSize = useWindowSize();

  const [naturalSize, setNaturalSize] = React.useState<ImageSize>({
    width: maxWidth,
    height: maxHeight,
  });

  const setAnimatedTransform = React.useCallback((from: Transform, to: Transform) => {
    // Apply the `from` position immediately
    flushSync(() => {
      setTransform(from);
    });

    // Apply the `to` transform later so the transition can happen
    setTransform(to);
  }, []);

  const getZoomedProps = React.useCallback(
    (rect: DOMRect) => {
      const targetWidth = Math.max(naturalSize.width, rect.width * minScale);
      const targetHeight = Math.max(naturalSize.height, rect.height * minScale);
      const width = Math.min(targetWidth, windowSize.width - safeMargin * 2);
      const height = Math.min(targetHeight, windowSize.height - safeMargin * 2);

      return {
        x: windowSize.width / 2 - (rect?.width ?? 0) / 2,
        y: windowSize.height / 2 - (rect?.height ?? 0) / 2,
        scale: Math.min(width / rect.width, height / rect.height),
      };
    },
    [naturalSize, safeMargin, windowSize],
  );

  const handleZoom = React.useCallback(() => {
    const rect = childRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const offset = window.scrollY;

    if (status === "closed") {
      const { x, y, scale } = getZoomedProps(rect);

      // Do not scale image if scale is smaller than the original size
      if (scale < 1) {
        return;
      }

      setStatus("opening");
      setAnimatedTransform(
        {
          x: rect.x,
          y: rect.y + offset,
          width: rect.width,
          height: rect.height,
          opacity: 0,
          scale: 1,
        },
        {
          x,
          y: y + offset,
          width: rect.width,
          height: rect.height,
          opacity: 0.8,
          scale,
        },
      );
    } else if (status === "open") {
      setStatus("closing");
      setAnimatedTransform(
        { ...transform },
        {
          x: rect.x,
          y: rect.y + offset,
          width: rect.width,
          height: rect.height,
          opacity: 0,
          scale: 1,
        },
      );
    }
  }, [setAnimatedTransform, getZoomedProps, status, transform]);

  const handleClose = status === "open" ? handleZoom : undefined;

  React.useEffect(() => {
    if (status === "open") {
      window.addEventListener("scroll", handleZoom);
    } else {
      window.removeEventListener("scroll", handleZoom);
    }

    return () => {
      window.removeEventListener("scroll", handleZoom);
    };
  }, [handleZoom, status]);

  React.useEffect(() => {
    if (status === "open") {
      const rect = childRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const offset = window.scrollY;
      const { x, y, scale } = getZoomedProps(rect);

      setTransform({
        x,
        y: y + offset,
        width: rect.width,
        height: rect.height,
        opacity: 0.8,
        scale,
      });
    }
  }, [getZoomedProps, status]);

  React.useEffect(() => {
    // Match --sm
    const mediaQueryList = window.matchMedia("(min-width: 768px)");

    const handleChange = ({ matches }: { matches: boolean }) => {
      setIsMobile(!matches);

      if (matches) {
        setStatus("closed");
      }
    };

    handleChange(mediaQueryList);
    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, []);

  return isMobile ? (
    <div className={className} style={style}>
      {children}
    </div>
  ) : (
    <Dialog.Root modal={false} open={status !== "closed"}>
      <Dialog.Trigger
        asChild
        aria-label="Zoom in"
        style={style}
        className={classNames(
          className,
          "ZoomableTrigger",
          (status === "open" || status === "opening" || status === "closing") &&
            "ZoomableTriggerHidden",
        )}
        onClick={handleZoom}
      >
        {React.cloneElement(children, {
          ...children.props,
          ref: childRef,
          onLoad: (event: React.SyntheticEvent<HTMLElement, Event>) => {
            let img: HTMLImageElement | null;

            if (event.currentTarget instanceof HTMLImageElement) {
              img = event.currentTarget;
            } else {
              // Also check for an image within the event target
              // next/image might have an aria-hidden element as a preloader,
              // which returns different natural width/height in Safari and Chrome
              img = event.currentTarget.querySelector<HTMLImageElement>(
                'img:not([aria-hidden="true"])',
              );
            }

            // Read the natural width/height if the given child is an image
            if (img && img.naturalWidth > 1 && img.naturalHeight > 1) {
              setNaturalSize({
                width: Math.min(img.naturalWidth, maxWidth),
                height: Math.min(img.naturalHeight, maxHeight),
              });
            }

            children.props.onLoad?.(event);
          },
        })}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Theme>
          <div
            aria-hidden="true"
            className="ZoomableOverlay"
            data-state={status}
            style={{ opacity: transform.opacity }}
            onClick={handleZoom}
            onWheel={handleClose}
          />
          <Dialog.Content
            className="ZoomableContent"
            data-state={status}
            style={{
              width: transform.width,
              height: transform.height,
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
              opacity: status === "fading-out" ? 0 : 1,
            }}
            onClick={handleZoom}
            onEscapeKeyDown={handleClose}
            onWheel={handleClose}
            onTransitionEnd={() => {
              if (status === "opening") {
                setStatus("open");
              } else if (status === "closing") {
                setStatus("fading-out");
              } else if (status === "fading-out") {
                setStatus("closed");
              }
            }}
          >
            <VisuallyHidden>
              <Dialog.Title>Zoomed in content</Dialog.Title>
            </VisuallyHidden>
            {React.cloneElement(children, children.props)}
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

function useWindowSize(callback?: () => void) {
  const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 });
  const callbackRef = React.useRef(callback);

  React.useEffect(() => {
    function handleResize() {
      callbackRef.current?.();
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

export { Zoomable };
