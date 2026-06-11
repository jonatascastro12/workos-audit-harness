"use client";

import classNames from "classnames";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { useControllableState } from "radix-ui/internal";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";
import { Text } from "./text.js";

const AccordionContext = React.createContext<{
  value: string[];
  onValueChange: (value: string) => void;
} | null>(null);

const useAccordionContext = () => {
  const accordionContext = React.useContext(AccordionContext);
  if (!accordionContext) {
    throw new TypeError("`useAccordionContext` must be called within `AccordionContext.Provider`");
  }

  return accordionContext;
};

interface AccordionRootOwnProps {
  size?: "1" | "2";
}

interface AccordionRootProps
  extends
    Omit<AccordionPrimitive.AccordionMultipleProps, "type">,
    AccordionRootOwnProps,
    MarginProps {}

const AccordionRoot = React.forwardRef<HTMLDivElement, AccordionRootProps>(
  (props, forwardedRef) => {
    const {
      size = "2",
      className,
      value: valueProp,
      defaultValue,
      onValueChange,
      ...rootProps
    } = extractProps(props, marginPropDefs);
    const [value, setValue] = useControllableState({
      prop: valueProp,
      defaultProp: defaultValue ?? [],
      onChange: onValueChange,
    });

    return (
      <AccordionContext.Provider
        value={{
          value,
          onValueChange: React.useCallback(
            (value) => {
              setValue((prev = []) => (prev.includes(value) ? prev : [...prev, value]));
            },
            [setValue],
          ),
        }}
      >
        <AccordionPrimitive.Root
          ref={forwardedRef}
          type="multiple"
          className={classNames("AccordionRoot", className, {
            "size-1": size === "1",
            "size-2": size === "2",
          })}
          {...rootProps}
          value={value}
          onValueChange={setValue}
        />
      </AccordionContext.Provider>
    );
  },
);

AccordionRoot.displayName = "AccordionRoot";

const AccordionItemContext = React.createContext<{ value: string } | null>(null);

const useAccordionItemContext = () => {
  const accordionItemContext = React.useContext(AccordionItemContext);
  if (!accordionItemContext) {
    throw new TypeError(
      "`useAccordionItemContext` must be called within `AccordionItemContext.Provider`",
    );
  }

  return accordionItemContext;
};

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, forwardedRef) => (
  <AccordionItemContext.Provider value={{ value: props.value }}>
    <AccordionPrimitive.Item
      ref={forwardedRef}
      className={classNames("AccordionItem", className)}
      {...props}
    />
  </AccordionItemContext.Provider>
));

AccordionItem.displayName = "AccordionItem";

interface AccordionHeaderOwnProps {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

interface AccordionHeaderProps extends React.ComponentPropsWithRef<"h3">, AccordionHeaderOwnProps {}

const AccordionHeader = React.forwardRef<HTMLHeadingElement, AccordionHeaderProps>(
  ({ as = "h3", className, children, ...props }, forwardedRef) => {
    const Tag = as;

    return (
      <AccordionPrimitive.Header asChild>
        <Tag ref={forwardedRef} className={classNames("AccordionHeader", className)} {...props}>
          <AccordionPrimitive.Trigger className="AccordionTrigger reset-button">
            <div className="AccordionChevron">
              <svg
                fill="none"
                height="16"
                viewBox="0 0 15 15"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor"></path>
              </svg>
            </div>
            <Text>{children}</Text>
          </AccordionPrimitive.Trigger>
        </Tag>
      </AccordionPrimitive.Header>
    );
  },
);

AccordionHeader.displayName = "AccordionHeader";

interface AccordionContentProps extends React.ComponentPropsWithRef<
  typeof AccordionPrimitive.Content
> {
  hiddenUntilFound?: boolean;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className, hiddenUntilFound = true, ...props }, forwardedRef) => {
    const context = useAccordionContext();
    const itemContext = useAccordionItemContext();
    const contentInnerRef = React.useRef<HTMLDivElement>(null);
    const [contentInnerHeight, setContentInnerHeight] = React.useState<number | null>(null);
    const isOpen = context.value.includes(itemContext.value);

    // Expand content for in-page search hits
    // https://developer.chrome.com/articles/hidden-until-found/
    const { onValueChange } = context;

    React.useEffect(() => {
      const contentInnerNode = contentInnerRef.current;
      const handleSearchMatch = () => onValueChange(itemContext.value);
      contentInnerNode?.addEventListener("beforematch", handleSearchMatch);

      return () => {
        contentInnerNode?.removeEventListener("beforematch", handleSearchMatch);
      };
    }, [itemContext.value, onValueChange]);

    // Passing `string` to `hidden` in JSX is not currently supported
    // https://github.com/facebook/react/issues/24740
    React.useEffect(() => {
      const contentInnerNode = contentInnerRef.current;
      if (contentInnerNode) {
        if (isOpen) {
          contentInnerNode.removeAttribute("hidden");
          // Query the inner content height after it's visible
          setContentInnerHeight(contentInnerNode.offsetHeight);
        } else {
          // and query again when closing before it's hidden (in case the content size has changed)
          setContentInnerHeight(contentInnerNode.offsetHeight);
          contentInnerNode.setAttribute("hidden", "until-found");
        }
      }
    }, [isOpen]);

    return (
      <AccordionPrimitive.Content
        ref={forwardedRef}
        className={classNames("AccordionContent", className)}
        forceMount={hiddenUntilFound || undefined}
        {...props}
        style={{
          ...props.style,
          "--workds-accordion-inner-content-height": `${contentInnerHeight}px`,
        }}
      >
        <div ref={contentInnerRef} className="AccordionContentInner">
          {children}
        </div>
      </AccordionPrimitive.Content>
    );
  },
);

AccordionContent.displayName = "AccordionContent";

export const Root = AccordionRoot;
export const Content = AccordionContent;
export const Header = AccordionHeader;
export const Item = AccordionItem;
