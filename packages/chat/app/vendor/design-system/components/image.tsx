import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";
import { Zoomable } from "./zoomable.js";

interface ImageProps extends MarginProps, React.ComponentPropsWithoutRef<"img"> {}

const Image = React.forwardRef<HTMLImageElement, ImageProps>((props, forwardedRef) => {
  const { children, className, style, ...imageProps } = extractProps(props, marginPropDefs);
  return (
    <div className={classNames(className, "Image")} style={style}>
      <Zoomable>
        <div className="ImageInner">
          {children ? (
            children
          ) : (
            <img ref={forwardedRef} className="ImageElement" {...imageProps} />
          )}
        </div>
      </Zoomable>
    </div>
  );
});

Image.displayName = "Image";

export { Image };
