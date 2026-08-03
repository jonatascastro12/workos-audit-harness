import classNames from "classnames";
import * as React from "react";
import { As } from "../helpers/as.js";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";
import { Slot } from "./slot.js";

interface ScreenshotRootProps extends React.ComponentPropsWithRef<"div">, MarginProps {}

const ScreenshotRoot = React.forwardRef<HTMLDivElement, ScreenshotRootProps>(
  (props, forwardedRef) => {
    const { className, ...rootProps } = extractProps(props, marginPropDefs);
    return (
      <div ref={forwardedRef} className={classNames(className, "ScreenshotRoot")} {...rootProps} />
    );
  },
);

ScreenshotRoot.displayName = "ScreenshotRoot";

type ScreenshotImageProps = As<"img", "div"> & React.ComponentPropsWithRef<"img">;

const ScreenshotImage = React.forwardRef<HTMLImageElement, ScreenshotImageProps>(
  ({ as: Tag = "img", children, className, ...props }, forwardedRef) => (
    <Slot
      ref={forwardedRef}
      // Disable pinterest from showing up
      data-pin-nopin
      className={classNames(className, "ScreenshotImage")}
      {...props}
    >
      <Tag>{children}</Tag>
    </Slot>
  ),
);

ScreenshotImage.displayName = "ScreenshotImage";

export const Root = ScreenshotRoot;
export const Image = ScreenshotImage;
