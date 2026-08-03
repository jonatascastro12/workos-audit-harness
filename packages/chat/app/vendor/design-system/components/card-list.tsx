import { Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { composeRefs, useControllableState } from "radix-ui/internal";
import * as React from "react";
import { Box, Flex, Heading, ScrollArea, Text } from "../index.js";

const RADIUS_MAPPING = {
  "1": "var(--radius-4)",
  "2": "var(--radius-5)",
} as const;

type BoxProps = Omit<React.ComponentPropsWithoutRef<typeof Box>, "className">;

type CardListRootProps = BoxProps & {
  children: React.ReactNode;
  radius?: keyof typeof RADIUS_MAPPING;
};

const CardListRoot = React.forwardRef<HTMLDivElement, CardListRootProps>(function CardListRoot(
  { children, radius = "1", style, ...props },
  ref,
) {
  const radiusValue = RADIUS_MAPPING[radius];

  return (
    <Box
      ref={ref}
      {...props}
      className="CardListRoot"
      style={{
        ...style,
        "--card-border-radius": radiusValue,
      }}
    >
      {children}
    </Box>
  );
});

interface CardListHeaderProps {
  children?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}

const CardListHeader = React.forwardRef<HTMLDivElement, CardListHeaderProps>(
  function CardListHeader({ children, title, description }, ref) {
    return (
      <Flex ref={ref} align="start" className="CardListHeader" direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Heading size="3">{title}</Heading>
          {description && (
            <Text as="p" color="gray" size="2">
              {description}
            </Text>
          )}
        </Flex>

        {children}
      </Flex>
    );
  },
);

type CardListBodyProps = BoxProps;

const CardListBody = React.forwardRef<HTMLDivElement, CardListBodyProps>(function CardListBody(
  { p, px, py, pt, pb, pl, pr, ...props },
  ref,
) {
  return (
    <ScrollArea.Root className="CardListScrollRoot">
      <ScrollArea.Viewport>
        <Text asChild size="2">
          <Box
            ref={ref}
            className="CardListBody"
            {...props}
            p={p === "current" ? "var(--card-padding)" : p}
          />
        </Text>
      </ScrollArea.Viewport>

      <ScrollArea.Scrollbar orientation="horizontal" />
      <ScrollArea.Scrollbar orientation="vertical" />
    </ScrollArea.Root>
  );
});

type CardListFooterProps = {
  children: React.ReactNode;
  justify?: "start" | "center" | "end" | "between";
  style?: React.CSSProperties;
};

const CardListFooter = React.forwardRef<HTMLDivElement, CardListFooterProps>(
  function CardListFooter({ children, justify = "start", style }, ref) {
    return (
      <Text asChild color="gray">
        <Flex
          ref={ref}
          align="center"
          className="CardListFooter"
          gap="3"
          justify={justify}
          style={style}
        >
          {children}
        </Flex>
      </Text>
    );
  },
);

interface CardListSearchProps extends React.ComponentPropsWithoutRef<"input"> {
  children?: React.ReactNode;
  onValueChange?: (value: string) => void;
}

const CardListSearch = React.forwardRef<HTMLInputElement, CardListSearchProps>(
  function CardListSearch(
    { onChange, onValueChange, value: valueProp, defaultValue, ...props },
    ref,
  ) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [value = "", setValue] = useControllableState({
      prop: valueProp !== undefined ? String(valueProp) : undefined,
      defaultProp: defaultValue !== undefined ? String(defaultValue) : "",
      onChange: onValueChange,
    });

    const hasValue = value.length > 0;

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      setValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      // Don't call setValue('') here — the native event below triggers
      // handleChange which calls setValue('') exactly once.
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));

      input.focus();
    };

    const isControlled = valueProp !== undefined;

    const inputValueProps = isControlled ? { value } : { defaultValue };

    return (
      <div className="CardListSearch">
        <input
          ref={composeRefs(ref, inputRef)}
          className="CardListSearchInput"
          placeholder="Search"
          {...props}
          {...inputValueProps}
          onChange={handleChange}
        />
        <MagnifyingGlassIcon className="CardListSearchIcon" />
        {hasValue && (
          <button
            aria-label="Clear search"
            className="CardListSearchClear"
            tabIndex={-1}
            type="button"
            onClick={handleClear}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Cross2Icon />
          </button>
        )}
      </div>
    );
  },
);

export {
  CardListBody as Body,
  CardListFooter as Footer,
  CardListHeader as Header,
  CardListRoot as Root,
  CardListSearch as Search,
};
