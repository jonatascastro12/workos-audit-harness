"use client";

import { CheckIcon, Link2Icon } from "@radix-ui/react-icons";
import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";
import { Tooltip } from "./tooltip.js";

interface PermanentLinkOwnProps {
  href: string;
  label: string;
}

interface PermanentLinkProps
  extends Omit<React.ComponentPropsWithRef<"a">, "href">, PermanentLinkOwnProps, MarginProps {}

const PermanentLink = React.forwardRef<HTMLAnchorElement, PermanentLinkProps>(
  (props, forwardedRef) => {
    const { children, className, style, label, href, ...permanentLinkProps } = extractProps(
      props,
      marginPropDefs,
    );

    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<number | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      const fullUrl = new URL(
        href,
        href.startsWith("#") ? window.location.href : window.location.origin,
      ).toString();

      setCopied(true);
      void navigator.clipboard.writeText(fullUrl);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset to link icon after 2 seconds
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2000);
    };

    React.useEffect(
      () => () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      },
      [],
    );

    return (
      <div className={classNames(className, "PermanentLink")} style={style}>
        <div className="PermanentLinkInner">{children}</div>
        <Tooltip content="Copy link to section">
          <a
            ref={forwardedRef}
            aria-label={label}
            className="PermanentLinkIcon"
            href={href}
            {...permanentLinkProps}
            onClick={handleClick}
          >
            {copied ? (
              <CheckIcon color="green" height="16" width="16" />
            ) : (
              <Link2Icon height="16" width="16" />
            )}
          </a>
        </Tooltip>
      </div>
    );
  },
);

PermanentLink.displayName = "PermanentLink";

export { PermanentLink };
