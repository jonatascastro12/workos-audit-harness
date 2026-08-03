"use client";
import { Flex } from "@radix-ui/themes/dist/esm/components/flex.js";
import { type TextProps, Text } from "@radix-ui/themes/dist/esm/components/text.js";
import * as React from "react";
import { type ButtonProps, Button } from "./button.js";

const EmptyStateContext = React.createContext<{
  size: "1" | "2";
}>({ size: "2" });
EmptyStateContext.displayName = "EmptyStateContext";

interface EmptyStateProps {
  action?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ElementType;
  minHeight?: number;
  size?: "1" | "2";
  subtitle?: string | React.ReactElement;
  title: string | React.ReactElement;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  action,
  children,
  icon: Icon,
  minHeight,
  size = "2",
  subtitle: subtitleProp,
  title: titleProp,
}) => {
  const iconSize = size === "1" ? 24 : 32;

  const title = (() => {
    if (!titleProp) {
      return null;
    }

    return React.isValidElement(titleProp) ? (
      titleProp
    ) : (
      <EmptyStateTitle>{titleProp}</EmptyStateTitle>
    );
  })();

  const subtitle = (() => {
    if (!subtitleProp) {
      return null;
    }

    return React.isValidElement(subtitleProp) ? (
      subtitleProp
    ) : (
      <EmptyStateSubtitle>{subtitleProp}</EmptyStateSubtitle>
    );
  })();

  return (
    <Flex
      align="center"
      direction="column"
      gap="3"
      justify="center"
      px="5"
      py={size === "1" ? "6" : "7"}
      style={minHeight ? { minHeight } : undefined}
    >
      <EmptyStateContext.Provider value={{ size }}>
        <Flex align="center" direction="column" gap={size === "2" ? "1" : "0"} justify="center">
          {Icon && <Icon color="gray" height={iconSize} width={iconSize} />}
          <Flex align="center" direction="column" gap="1" justify="center">
            {title}
            {subtitle}
            {children}
          </Flex>
        </Flex>
        {action}
      </EmptyStateContext.Provider>
    </Flex>
  );
};

const EmptyStateTitle = React.forwardRef<HTMLParagraphElement, TextProps>(function EmptyStateTitle(
  { children, ...props },
  ref,
) {
  const context = React.useContext(EmptyStateContext);
  return (
    <Text
      align="center"
      as="p"
      size={context.size === "2" ? "3" : "2"}
      weight={context.size === "2" ? "medium" : "regular"}
      {...props}
      ref={ref}
    >
      {children}
    </Text>
  );
});

const EmptyStateSubtitle = React.forwardRef<HTMLParagraphElement, TextProps>(
  function EmptyStateSubtitle({ children, ...props }, ref) {
    const context = React.useContext(EmptyStateContext);
    return (
      <Text
        align="center"
        as="p"
        color="gray"
        size="2"
        weight={context.size === "2" ? "regular" : "light"}
        {...props}
        ref={ref}
      >
        {children}
      </Text>
    );
  },
);

const EmptyStateAction = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    const context = React.useContext(EmptyStateContext);
    return (
      <Button ref={ref} size={context.size} {...props}>
        {children}
      </Button>
    );
  },
);
EmptyStateAction.displayName = "EmptyStateAction";

export {
  EmptyStateAction as Action,
  EmptyState as Root,
  EmptyStateSubtitle as Subtitle,
  EmptyStateTitle as Title,
};
