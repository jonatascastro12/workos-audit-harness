"use client";

import * as React from "react";
import { Avatar, Box, Code, CopyChip, Flex, Heading, IconPanel, Skeleton } from "../index.js";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ResourceHeaderContextValue {
  loading: boolean;
  hasLeftAccessory: boolean;
  registerLeftAccessory: () => void;
}

const ResourceHeaderContext = React.createContext<ResourceHeaderContextValue>({
  loading: false,
  hasLeftAccessory: false,
  registerLeftAccessory: () => undefined,
});

const useResourceHeader = () => React.useContext(ResourceHeaderContext);

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

type FlexProps = React.ComponentPropsWithoutRef<typeof Flex>;

interface ResourceHeaderRootProps extends Omit<FlexProps, "align" | "gap" | "justify" | "width"> {
  loading?: boolean;
}

const ResourceHeaderRoot = React.forwardRef<HTMLDivElement, ResourceHeaderRootProps>(
  ({ loading = false, children, ...props }, forwardedRef) => {
    const [hasLeftAccessory, setHasLeftAccessory] = React.useState(false);
    const registerLeftAccessory = React.useCallback(() => setHasLeftAccessory(true), []);

    const contextValue = React.useMemo(
      () => ({ loading, hasLeftAccessory, registerLeftAccessory }),
      [loading, hasLeftAccessory, registerLeftAccessory],
    );

    return (
      <ResourceHeaderContext.Provider value={contextValue}>
        <Flex ref={forwardedRef} align="center" gap="5" justify="between" width="100%" {...props}>
          {children}
        </Flex>
      </ResourceHeaderContext.Provider>
    );
  },
);
ResourceHeaderRoot.displayName = "ResourceHeaderRoot";

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

interface ResourceHeaderContentProps extends Omit<FlexProps, "align" | "gap"> {}

const ResourceHeaderContent = React.forwardRef<HTMLDivElement, ResourceHeaderContentProps>(
  ({ children, style, ...props }, forwardedRef) => (
    <Flex ref={forwardedRef} align="center" gap="4" style={{ minWidth: 0, ...style }} {...props}>
      {children}
    </Flex>
  ),
);
ResourceHeaderContent.displayName = "ResourceHeaderContent";

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

type IconPanelProps = React.ComponentPropsWithoutRef<typeof IconPanel>;

interface ResourceHeaderIconProps extends Omit<IconPanelProps, "size" | "children"> {
  children: React.ReactNode;
  variant?: "classic" | "solid";
}

const ResourceHeaderIcon = React.forwardRef<HTMLDivElement, ResourceHeaderIconProps>(
  ({ children, variant = "classic", ...props }, forwardedRef) => {
    const { loading, registerLeftAccessory } = useResourceHeader();

    React.useLayoutEffect(() => {
      registerLeftAccessory();
    }, [registerLeftAccessory]);

    if (loading) {
      return (
        <Skeleton>
          <Box height="56px" style={{ borderRadius: "14px" }} width="56px" />
        </Skeleton>
      );
    }

    return (
      <IconPanel ref={forwardedRef} aria-hidden size="4" variant={variant} {...props}>
        <Flex align="center" height="100%" justify="center">
          {children}
        </Flex>
      </IconPanel>
    );
  },
);
ResourceHeaderIcon.displayName = "ResourceHeaderIcon";

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

interface ResourceHeaderAvatarProps {
  src?: string;
  fallback: string;
}

const ResourceHeaderAvatar = React.forwardRef<HTMLDivElement, ResourceHeaderAvatarProps>(
  ({ src, fallback }, forwardedRef) => {
    const { loading, registerLeftAccessory } = useResourceHeader();

    React.useLayoutEffect(() => {
      registerLeftAccessory();
    }, [registerLeftAccessory]);

    if (loading) {
      return (
        <Skeleton>
          <Box height="56px" style={{ borderRadius: "100%" }} width="56px" />
        </Skeleton>
      );
    }

    return (
      <Box ref={forwardedRef} flexShrink="0">
        <Avatar.Root size="3" src={src}>
          {!src && <Avatar.Text>{fallback}</Avatar.Text>}
        </Avatar.Root>
      </Box>
    );
  },
);
ResourceHeaderAvatar.displayName = "ResourceHeaderAvatar";

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

type HeadingProps = React.ComponentPropsWithoutRef<typeof Heading>;
type ResourceHeaderTitleProps = Omit<HeadingProps, "size" | "as">;

const ResourceHeaderTitle = React.forwardRef<HTMLHeadingElement, ResourceHeaderTitleProps>(
  ({ children, style, ...props }, forwardedRef) => {
    const { loading, hasLeftAccessory } = useResourceHeader();
    const size = hasLeftAccessory ? "5" : "6";

    if (loading) {
      return (
        <Skeleton>
          <Heading aria-hidden as="h2" size={size}>
            {"\u00A0".repeat(56)}
          </Heading>
        </Skeleton>
      );
    }

    return (
      <Heading
        ref={forwardedRef}
        as="h2"
        size={size}
        style={{ overflowWrap: "break-word", ...style }}
        {...props}
        asChild={false}
      >
        {children}
      </Heading>
    );
  },
);
ResourceHeaderTitle.displayName = "ResourceHeaderTitle";

// ---------------------------------------------------------------------------
// Id
// ---------------------------------------------------------------------------

interface ResourceHeaderIdProps {
  children: string;
  label?: string;
}

const ResourceHeaderId = React.forwardRef<HTMLButtonElement, ResourceHeaderIdProps>(
  ({ children, label = "ID" }, forwardedRef) => {
    const { loading } = useResourceHeader();

    if (loading) {
      return (
        <Skeleton>
          <Code aria-hidden variant="ghost">
            {"\u00A0".repeat(24)}
          </Code>
        </Skeleton>
      );
    }

    return (
      <CopyChip
        ref={forwardedRef}
        aria-label={`Copy ${label}`}
        color="gray"
        style={{ alignSelf: "start" }}
      >
        <Code variant="ghost">{children}</Code>
      </CopyChip>
    );
  },
);
ResourceHeaderId.displayName = "ResourceHeaderId";

// ---------------------------------------------------------------------------
// Accessories
// ---------------------------------------------------------------------------

interface ResourceHeaderAccessoriesProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ResourceHeaderAccessories = React.forwardRef<HTMLDivElement, ResourceHeaderAccessoriesProps>(
  ({ children, style, ...props }, forwardedRef) => {
    const { loading } = useResourceHeader();

    if (loading) {
      return null;
    }

    return (
      <Flex
        ref={forwardedRef}
        align="center"
        gap="4"
        style={{ minWidth: 0, ...style }}
        wrap="nowrap"
        {...props}
      >
        {children}
      </Flex>
    );
  },
);
ResourceHeaderAccessories.displayName = "ResourceHeaderAccessories";

// ---------------------------------------------------------------------------
// TextColumn
// ---------------------------------------------------------------------------

interface ResourceHeaderTextColumnProps extends Omit<FlexProps, "align" | "direction" | "gap"> {}

const ResourceHeaderTextColumn = React.forwardRef<HTMLDivElement, ResourceHeaderTextColumnProps>(
  ({ children, style, ...props }, forwardedRef) => (
    <Flex
      ref={forwardedRef}
      align="start"
      direction="column"
      gap="2"
      style={{ minWidth: 0, ...style }}
      {...props}
    >
      {children}
    </Flex>
  ),
);
ResourceHeaderTextColumn.displayName = "ResourceHeaderTextColumn";

// ---------------------------------------------------------------------------
// MetaRow
// ---------------------------------------------------------------------------

interface ResourceHeaderMetaRowProps extends Omit<FlexProps, "align" | "direction" | "gap"> {}

const ResourceHeaderMetaRow = React.forwardRef<HTMLDivElement, ResourceHeaderMetaRowProps>(
  ({ children, style, ...props }, forwardedRef) => (
    <Flex ref={forwardedRef} align="center" gap="4" style={{ minWidth: 0, ...style }} {...props}>
      {children}
    </Flex>
  ),
);
ResourceHeaderMetaRow.displayName = "ResourceHeaderMetaRow";

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface ResourceHeaderActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ResourceHeaderActions = React.forwardRef<HTMLDivElement, ResourceHeaderActionsProps>(
  ({ children, ...props }, forwardedRef) => {
    const { loading } = useResourceHeader();

    if (loading) {
      return null;
    }

    return (
      <Flex ref={forwardedRef} align="center" flexShrink="0" gap="2" {...props}>
        {children}
      </Flex>
    );
  },
);
ResourceHeaderActions.displayName = "ResourceHeaderActions";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  ResourceHeaderAccessories as Accessories,
  ResourceHeaderActions as Actions,
  ResourceHeaderAvatar as Avatar,
  ResourceHeaderContent as Content,
  ResourceHeaderIcon as Icon,
  ResourceHeaderId as Id,
  ResourceHeaderMetaRow as MetaRow,
  ResourceHeaderRoot as Root,
  ResourceHeaderTextColumn as TextColumn,
  ResourceHeaderTitle as Title,
};
