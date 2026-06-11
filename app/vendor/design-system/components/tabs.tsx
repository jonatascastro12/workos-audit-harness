"use client";

import * as ThemesTabs from "@radix-ui/themes/dist/esm/components/tabs.js";
import { composeRefs, useControllableState } from "radix-ui/internal";
import * as React from "react";

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

const useTabsContext = () => {
  const tabsContext = React.useContext(TabsContext);
  if (!tabsContext) {
    throw new TypeError("`useTabsContext` must be called within `TabsContext.Provider`");
  }

  return tabsContext;
};

type TabsRootElement = React.ElementRef<typeof ThemesTabs.Root>;
type TabsRootProps = React.ComponentPropsWithoutRef<typeof ThemesTabs.Root>;
const TabsRoot = React.forwardRef<TabsRootElement, TabsRootProps>(
  ({ value: valueProp, defaultValue, onValueChange, ...props }, forwardedRef) => {
    const [value, setValue] = useControllableState({
      prop: valueProp,
      defaultProp: defaultValue ?? "",
      onChange: onValueChange,
    });

    return (
      <TabsContext.Provider
        value={{
          value,
          onValueChange: setValue,
        }}
      >
        <ThemesTabs.Root ref={forwardedRef} {...props} value={value} onValueChange={setValue} />
      </TabsContext.Provider>
    );
  },
);
TabsRoot.displayName = "TabsRoot";

type TabsContentElement = React.ElementRef<typeof ThemesTabs.Content>;
type TabsContentProps = React.ComponentPropsWithoutRef<typeof ThemesTabs.Content>;
const TabsContent = React.forwardRef<TabsContentElement, TabsContentProps>(
  ({ value, ...props }, forwardedRef) => {
    const context = useTabsContext();
    const isActive = context.value === value;
    const contentRef = React.useRef<TabsContentElement | null>(null);

    // Expand content for in-page search hits
    // https://developer.chrome.com/articles/hidden-until-found/
    const { onValueChange } = context;

    React.useEffect(() => {
      const contentNode = contentRef.current;
      const handleSearchMatch = () => onValueChange(value);
      contentNode?.addEventListener("beforematch", handleSearchMatch);
      return () => {
        contentNode?.removeEventListener("beforematch", handleSearchMatch);
      };
    }, [value, onValueChange]);

    // Passing `string` to `hidden` in JSX is not currently supported
    // https://github.com/facebook/react/issues/24740
    React.useEffect(() => {
      const contentNode = contentRef.current;
      if (contentNode) {
        if (isActive) {
          contentNode.removeAttribute("hidden");
        } else {
          contentNode.setAttribute("hidden", "until-found");
        }
      }
    }, [isActive]);

    return (
      <ThemesTabs.Content
        ref={composeRefs(contentRef, forwardedRef)}
        forceMount
        // Don't flash force-mounted tabs on server render
        hidden={!isActive}
        value={value}
        {...props}
      />
    );
  },
);
TabsContent.displayName = "TabsContent";

export const Root = TabsRoot;
export const List = ThemesTabs.List;
export const Trigger = ThemesTabs.Trigger;
export const Content = TabsContent;
