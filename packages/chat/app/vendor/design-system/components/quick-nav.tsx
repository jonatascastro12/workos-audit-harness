import classNames from "classnames";
import * as React from "react";
import { ComponentPropsWithout, extractProps, RemovedProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";
import { Heading as ThemesHeading } from "./heading.js";
import { Link as ThemesLink } from "./link.js";
import { Text } from "./text.js";

interface QuickNavRootProps extends ComponentPropsWithout<"div", RemovedProps>, MarginProps {}

const QuickNavRoot = React.forwardRef<HTMLDivElement, QuickNavRootProps>((props, forwardedRef) => {
  const { className, ...rootProps } = extractProps(props, marginPropDefs);
  return (
    <Text
      ref={forwardedRef}
      as="div"
      className={classNames(className, "QuickNavRoot")}
      role="navigation"
      size="2"
      {...rootProps}
    />
  );
});

QuickNavRoot.displayName = "QuickNavRoot";

type QuickNavHeadingProps = Omit<React.ComponentPropsWithoutRef<typeof ThemesHeading>, "asChild">;

const QuickNavHeading = React.forwardRef<HTMLHeadingElement, QuickNavHeadingProps>(
  ({ children = "On this page", ...props }, forwardedRef) => (
    <ThemesHeading ref={forwardedRef} as="h2" mb="2" size="4" {...props}>
      {children}
    </ThemesHeading>
  ),
);

QuickNavHeading.displayName = "QuickNavHeading";

const QuickNavList = React.forwardRef<HTMLUListElement, React.ComponentPropsWithRef<"ul">>(
  ({ className, ...props }, forwardedRef) => (
    <ul ref={forwardedRef} className={classNames(className, "rt-reset QuickNavList")} {...props} />
  ),
);

QuickNavList.displayName = "QuickNavList";

const QuickNavItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithRef<"li">>(
  ({ className, ...props }, forwardedRef) => (
    <li ref={forwardedRef} className={classNames(className, "QuickNavItem")} {...props} />
  ),
);

QuickNavItem.displayName = "QuickNavItem";

const QuickNavLink = React.forwardRef<
  HTMLAnchorElement,
  Omit<React.ComponentPropsWithRef<"a"> & { asChild?: boolean }, "color">
>((props, forwardedRef) => (
  <ThemesLink ref={forwardedRef} color="gray" underline="hover" {...props} />
));

QuickNavLink.displayName = "QuickNavLink";

const QuickNavSub = React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={classNames(className, "QuickNavSub")} {...props} />
  ),
);

QuickNavSub.displayName = "QuickNavSub";

export const Root = QuickNavRoot;
export const Heading = QuickNavHeading;
export const List = QuickNavList;
export const Item = QuickNavItem;
export const Link = QuickNavLink;
export const Sub = QuickNavSub;
