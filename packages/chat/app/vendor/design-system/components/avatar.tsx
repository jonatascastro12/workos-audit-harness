import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";

interface AvatarOwnProps {
  src?: string;
  size?: "1" | "2" | "3" | "4" | "5";
}

interface AvatarRootProps extends React.ComponentPropsWithRef<"div">, AvatarOwnProps, MarginProps {}

const AvatarRoot = React.forwardRef<HTMLDivElement, AvatarRootProps>((props, forwardedRef) => {
  const {
    src,
    size = "1",
    children,
    className,
    style,
    ...rootProps
  } = extractProps(props, marginPropDefs);
  return (
    <div
      ref={forwardedRef}
      className={classNames(className, "AvatarRoot", {
        "size-1": size === "1",
        "size-2": size === "2",
        "size-3": size === "3",
        "size-4": size === "4",
        "size-5": size === "5",
        "has-image": Boolean(src),
      })}
      style={{
        backgroundImage: src ? `url("${src}")` : undefined,
        ...style,
      }}
      {...rootProps}
    >
      {children}
    </div>
  );
});

AvatarRoot.displayName = "AvatarRoot";

type AvatarTextProps = React.ComponentPropsWithRef<"span">;

const AvatarText = React.forwardRef<HTMLSpanElement, AvatarTextProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <span
      ref={forwardedRef}
      aria-hidden="true"
      className={classNames(className, "AvatarText")}
      {...props}
    >
      {children}
    </span>
  ),
);

AvatarText.displayName = "AvatarText";

export const Root = AvatarRoot;
export const Text = AvatarText;
