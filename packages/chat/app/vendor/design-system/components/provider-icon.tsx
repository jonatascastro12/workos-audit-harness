import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import type { ProviderIconSlug } from "../icons.js";
import { marginPropDefs, MarginProps } from "../props.js";

interface ProviderIconProps extends React.ComponentPropsWithRef<"div">, MarginProps {
  provider: ProviderIconSlug;
  size?: "1" | "2" | "3" | "4";
}

const ProviderIcon = React.forwardRef<HTMLDivElement, ProviderIconProps>((props, forwardedRef) => {
  const {
    provider,
    size = "4",
    className,
    ...providerIconProps
  } = extractProps(props, marginPropDefs);

  return (
    <div
      {...providerIconProps}
      ref={forwardedRef}
      className={classNames("ProviderIcon", `size-${size}`, className)}
      data-provider={provider}
    />
  );
});

ProviderIcon.displayName = "ProviderIcon";

export { ProviderIcon };
export type { ProviderIconProps };
export type { ProviderIconSlug as ProviderIconType } from "../icons.js";
