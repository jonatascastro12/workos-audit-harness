"use client";

import classNames from "classnames";
import { Collapsible, NavigationMenu } from "radix-ui";
import { useComposedRefs } from "radix-ui/internal";
import * as React from "react";
import scrollIntoView from "scroll-into-view-if-needed";
import { extractProps, getSubtree } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";

interface PageNavRootOwnProps {
  color?: "gray" | "purple";
}

interface PageNavRootProps
  extends
    Omit<React.ComponentPropsWithRef<"div">, "defaultValue" | "dir" | "color">,
    PageNavRootOwnProps,
    MarginProps {}

const PageNavRoot = (props: PageNavRootProps) => {
  const { children, color = "gray", className, ...rootProps } = extractProps(props, marginPropDefs);
  return (
    <NavigationMenu.Root
      orientation="vertical"
      className={classNames(className, "PageNavRoot", {
        gray: color === "gray",
        purple: color === "purple",
      })}
      {...rootProps}
    >
      <NavigationMenu.List asChild>
        <div>{children}</div>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
};

const PageNavSub = (props: React.ComponentPropsWithoutRef<typeof Collapsible.Root>) => (
  <Collapsible.Root className="PageNavSub" {...props} />
);

const PageNavSubContent = (props: React.ComponentPropsWithoutRef<typeof Collapsible.Content>) => (
  <Collapsible.Content className="PageNavSubContent" {...props} />
);

interface PageNavLinkOwnProps {
  state?: "normal" | "active" | "disabled";
}

interface PageNavLinkProps
  extends PageNavLinkOwnProps, React.ComponentPropsWithRef<typeof NavigationMenu.Link> {}

const PageNavLink = React.forwardRef<HTMLAnchorElement, PageNavLinkProps>(
  ({ asChild, className, children, state = "normal", onSelect, ...props }, forwardedRef) => {
    const ref = React.useRef<HTMLAnchorElement>(null);
    const composedRef = useComposedRefs(ref, forwardedRef);

    React.useEffect(() => {
      // Scroll active links into view when in a Scroll Area
      if (ref.current && state === "active") {
        const container = document.querySelector("[data-radix-scroll-area-viewport]");

        if (!container) {
          return;
        }

        // Tread very, very, very carefully if changing this.
        // Sneaky bugs reproduced only on select cursed devices may show up.
        scrollIntoView(ref.current, {
          block: "nearest",
          scrollMode: "if-needed",
          boundary: (parent) => Boolean(container.contains(parent)),
          behavior: (actions) => {
            actions.forEach(({ el, top }) => {
              const dir = el.scrollTop < top ? 1 : -1;
              el.scrollTop = top + 80 * dir;
            });
          },
        });
      }
    }, [state]);

    if (state === "disabled") {
      return (
        <span
          ref={composedRef}
          className={classNames(className, "PageNavLink disabled")}
          {...props}
        >
          <span className="PageNavLinkInnerVisible">
            <span className="PageNavText">{children}</span>
          </span>
          <span className="PageNavLinkInnerHidden">
            <span className="PageNavText">{children}</span>
          </span>
        </span>
      );
    }

    return (
      <NavigationMenu.Link
        ref={composedRef}
        asChild={asChild}
        className={classNames(className, "PageNavLink reset-a", {
          active: state === "active",
          normal: state === "normal",
        })}
        onSelect={onSelect}
        {...props}
      >
        {getSubtree({ asChild, children }, (children) => (
          <>
            <span className="PageNavLinkInnerVisible">
              <span className="PageNavText">{children}</span>
            </span>
            <span className="PageNavLinkInnerHidden">
              <span className="PageNavText">{children}</span>
            </span>
          </>
        ))}
      </NavigationMenu.Link>
    );
  },
);

PageNavLink.displayName = "PageNavLink";

const PageNavLinkIcon = (props: React.PropsWithChildren) => (
  <div className="PageNavLinkIcon" {...props} />
);

const PageNavLabel = (props: React.PropsWithChildren) => (
  <span className="PageNavLabel">
    <span className="PageNavText" {...props} />
  </span>
);

export const Root = PageNavRoot;
export const Sub = PageNavSub;
export const SubContent = PageNavSubContent;
export const Link = PageNavLink;
export const LinkIcon = PageNavLinkIcon;
export const Label = PageNavLabel;
