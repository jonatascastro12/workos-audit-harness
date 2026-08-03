"use client";

import { CheckIcon, ChevronDownIcon, Cross2Icon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { ThickCheckIcon } from "@radix-ui/themes/components/icons";
import { Theme, useThemeContext } from "@radix-ui/themes/dist/esm/components/theme.js";
import classNames from "classnames";
import { ScrollArea as ScrollAreaPrimitive, Slot } from "radix-ui";
import { Presence, Primitive, useComposedRefs, useLayoutEffect } from "radix-ui/internal";
import * as React from "react";
import { flushSync } from "react-dom";
import { createContext } from "../helpers/create-context.js";
import { type ComponentPropsWithout, type RemovedProps, extractProps } from "../helpers/themes.js";
import { useEffectEvent } from "../helpers/use-effect-event.js";
import { type MarginProps, marginPropDefs } from "../props.js";
import { Button } from "./button.js";
import { type ChipProps, Chip } from "./chip.js";
import * as ComboboxPrimitive from "./combobox.primitive.js";
import {
  type CheckboxOwnProps,
  type ContentOwnProps,
  type InputOwnProps,
  type PopoverOwnProps,
  type RootOwnProps,
  checkboxPropDefs,
  contentPropDefs,
  inputPropDefs,
  popoverPropDefs,
  rootPropDefs,
} from "./combobox.props.js";
import { Flex } from "./flex.js";
import { IconButton } from "./icon-button.js";
import { Label } from "./label.js";
import { Spinner } from "./spinner.js";
import * as TextField from "./text-field.js";
import { Tooltip } from "./tooltip.js";

type ComboboxContextValue = RootOwnProps;
const [ComboboxProvider, useComboboxContext] = createContext<ComboboxContextValue>(
  "WorkDS.ComboboxContext",
  {},
);

type ComboboxRootProps = RootOwnProps & ComboboxPrimitive.ComboboxProps;

function ComboboxRoot(props: ComboboxRootProps) {
  const { children, size = rootPropDefs.size.default, ...rootProps } = props;
  return (
    <ComboboxPrimitive.Root {...rootProps}>
      <ComboboxProvider size={size}>{children}</ComboboxProvider>
    </ComboboxPrimitive.Root>
  );
}

interface ComboboxInputProps
  extends InputOwnProps, Omit<ComboboxPrimitive.ComboboxInputProps, keyof InputOwnProps> {
  disableClear?: boolean;
  isLoading?: boolean;
  hideDisclosure?: boolean;
}

const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  function ComboboxInput(props, forwardedRef) {
    const {
      children,
      className,
      asChild,
      disableClear,
      hideDisclosure,
      isLoading,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error: Not explicitly defined in the props but acceptable as
      // a DOM attribute. Consumers may use this if they render the element in
      // some other popover and want consistent styling, such as in the command
      // palette dialog.
      "data-within-popover": withinPopoverProp,
      ...inputProps
    } = extractProps(
      props,
      // NOTE: Un-comment if moving to Radix Themes
      // Pass size value from the context to generate styles
      // { size: context?.size, ...props },
      // Pass size prop def to allow it to be extracted
      // { size: rootPropDefs.size },
      inputPropDefs,
      marginPropDefs,
    );

    const context = ComboboxPrimitive.useComboboxContext();
    const isInPopover = useComboboxPopoverContext("Combobox.Input");

    // Radix Themes passes data attributes to the input element, but we want the
    // `data-within-popover` attribute to be set on the root element for styling
    // purposes here.
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const ref = useComposedRefs(forwardedRef, inputRef);
    useLayoutEffect(() => {
      const input = inputRef.current;
      const root = input?.parentElement;
      if (!input || !root) {
        return;
      }

      if (withinPopoverProp !== undefined) {
        root.setAttribute("data-within-popover", withinPopoverProp);
      } else if (isInPopover) {
        root.setAttribute("data-within-popover", "true");
      } else {
        root.removeAttribute("data-within-popover");
      }

      return () => {
        root.removeAttribute("data-within-popover");
      };
    }, [isInPopover, withinPopoverProp]);

    return (
      <ComboboxPrimitive.Input
        ref={ref}
        {...inputProps}
        asChild
        className={classNames("ComboboxInput", className)}
      >
        {asChild ? (
          <Slot.Slottable>{children}</Slot.Slottable>
        ) : (
          <Slot.Slottable>
            <TextField.Root
              data-within-popover={withinPopoverProp ?? (isInPopover || false)}
              variant="surface"
            >
              {children}
            </TextField.Root>
          </Slot.Slottable>
        )}

        <ComboboxInputSlot>
          {(() => {
            const placeholder = <span className="ComboboxInputSlotPlaceholder" />;

            if (isLoading) {
              return <Spinner />;
            }

            if (!context.empty) {
              return !disableClear ? <ComboboxClear /> : placeholder;
            }

            return isInPopover || hideDisclosure ? placeholder : <ComboboxDisclosure />;
          })()}
        </ComboboxInputSlot>
      </ComboboxPrimitive.Input>
    );
  },
);

type ComboboxInputSlotProps = React.ComponentPropsWithoutRef<typeof TextField.Slot>;

const ComboboxInputSlot = React.forwardRef<HTMLDivElement, ComboboxInputSlotProps>(
  function ComboboxInputSlot(props, ref) {
    const { className, side = "right", ...slotProps } = props;
    return (
      <TextField.Slot
        ref={ref}
        className={classNames("ComboboxInputSlot", className)}
        side={side}
        {...slotProps}
      />
    );
  },
);

interface ComboboxClearProps extends Omit<
  React.ComponentPropsWithoutRef<typeof IconButton>,
  "children"
> {
  size?: "1" | "2" | "3";
}

const ComboboxClear = React.forwardRef<HTMLButtonElement, ComboboxClearProps>(
  function ComboboxClear(props, ref) {
    const { className, size = "1", ...buttonProps } = props;
    return (
      <ComboboxPrimitive.Clear
        {...buttonProps}
        render={(context, { color, ...props }) => {
          const button = (
            <IconButton
              ref={ref}
              {...props}
              fullyDisabled={context.empty}
              size={size}
              className={classNames("ComboboxClear ComboboxIconButton", className)}
            >
              <Cross2Icon aria-hidden className="ComboboxIcon ComboboxClearIcon" />
            </IconButton>
          );

          return context.empty ? button : <Tooltip content="Clear input">{button}</Tooltip>;
        }}
      />
    );
  },
);

interface ComboboxDisclosureProps extends Omit<
  React.ComponentPropsWithoutRef<typeof IconButton>,
  "children"
> {
  size?: "1" | "2" | "3";
}

const ComboboxDisclosure = React.forwardRef<HTMLButtonElement, ComboboxDisclosureProps>(
  function ComboboxDisclosure(props, ref) {
    const { className, size = "1", ...buttonProps } = props;
    return (
      <ComboboxPrimitive.Trigger
        {...buttonProps}
        returnFocusOnClose={false}
        render={(context, { color, ...props }) => {
          const button = (
            <IconButton
              ref={ref}
              {...props}
              fullyDisabled={context.disabled}
              size={size}
              className={classNames("ComboboxIconButton ComboboxDisclosure", className)}
            >
              <ChevronDownIcon aria-hidden className="ComboboxIcon ComboboxSelectIcon" />
            </IconButton>
          );

          return context.disabled || context.open ? (
            button
          ) : (
            <Tooltip content="Show suggestions">{button}</Tooltip>
          );
        }}
      />
    );
  },
);

type ComboboxTriggerProps = Omit<
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Trigger>,
  "asChild" | "render"
>;

const ComboboxTrigger = React.forwardRef<HTMLButtonElement, ComboboxTriggerProps>(
  function ComboboxTrigger(props, ref) {
    const { className, ...buttonProps } = props;
    return (
      <ComboboxPrimitive.Trigger
        {...buttonProps}
        ref={ref}
        asChild
        className={classNames("ComboboxTrigger", className)}
      />
    );
  },
);

type ComboboxAnchorProps = Omit<
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Anchor>,
  "asChild"
>;

const ComboboxAnchor = React.forwardRef<HTMLDivElement, ComboboxAnchorProps>(
  function ComboboxAnchor(props, ref) {
    const { children, className, ...anchorProps } = props;
    let child:
      | React.ReactPortal
      | React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>;
    try {
      const onlyChild = React.Children.only(children);
      if (!React.isValidElement(onlyChild)) {
        throw Error();
      }

      child = onlyChild;
    } catch {
      throw new Error(
        "ComboboxAnchor expects exactly one child element. Please wrap your content in a single element.",
      );
    }

    return (
      <ComboboxPrimitive.Anchor
        ref={ref}
        {...anchorProps}
        // Ideally we would always use `asChild`, but because of how Radix
        // Themes splits the props it forwards to the TextField root between two
        // elements, the anchor may only match the width of the input instead of
        // the entire combobox if there is a child slot. If we change this in
        // Radix, consider setting this to `true` to simplify the DOM structure.
        asChild={false}
        className={classNames("ComboboxAnchor", className)}
      >
        {child}
      </ComboboxPrimitive.Anchor>
    );
  },
);

const [ComboboxPopoverProvider, useComboboxPopoverContext] = createContext<boolean>(
  "WorkDS.ComboboxPopoverContext",
  false,
);

interface ComboboxPopoverProps
  extends ComponentPropsWithout<typeof ComboboxPrimitive.Popover, RemovedProps>, PopoverOwnProps {
  container?: React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Portal>["container"];
}

const ComboboxPopover = React.forwardRef<HTMLDivElement, ComboboxPopoverProps>(
  function ComboboxPopover({ children, ...props }, ref) {
    const context = useComboboxContext("Combobox.Popover");
    const { className, forceMount, container, ...popoverProps } = extractProps(
      // Pass size value from the context to generate styles
      { size: context?.size, ...props },
      // Pass size prop def to allow it to be extracted
      { size: rootPropDefs.size },
      popoverPropDefs,
    );

    return (
      <ComboboxPrimitive.Portal container={container} forceMount={forceMount}>
        <Theme asChild>
          <ComboboxPrimitive.Popover
            ref={ref}
            align="start"
            sideOffset={4}
            {...popoverProps}
            className={classNames(className, "ComboboxPopover", "rt-PopperContent")}
          >
            <ComboboxPopoverProvider contextValue={true}>{children}</ComboboxPopoverProvider>
          </ComboboxPrimitive.Popover>
        </Theme>
      </ComboboxPrimitive.Portal>
    );
  },
);

interface ComboboxContentBoxProps
  extends ComponentPropsWithout<"div", RemovedProps>, PopoverOwnProps {}

const ComboboxContentBox = React.forwardRef<HTMLDivElement, ComboboxContentBoxProps>(
  function ComboboxContentBox({ children, ...props }, ref) {
    const context = useComboboxContext("Combobox.ContentBox");
    const { className, ...boxProps } = extractProps(
      // Pass size value from the context to generate styles
      { size: context?.size, ...props },
      // Pass size prop def to allow it to be extracted
      { size: rootPropDefs.size },
      // popoverPropDefs,
    );

    return (
      <Flex
        direction="column"
        flexBasis="auto"
        flexGrow="1"
        width="100%"
        {...boxProps}
        ref={ref}
        className={classNames(className, "ComboboxContentBox")}
      >
        {children}
      </Flex>
    );
  },
);

interface _ComboboxContentProps
  extends
    ContentOwnProps,
    Omit<React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Content>, keyof ContentOwnProps> {}

// NOTE: Internal prop defs, do not use if we move to Radix Themes
type ComboboxContentProps = Omit<_ComboboxContentProps, "color" | "highContrast" | "variant">;

const ComboboxContent = React.forwardRef<HTMLDivElement, ComboboxContentProps>(
  function ComboboxContent(props: _ComboboxContentProps, ref) {
    const context = useComboboxContext("Combobox.Content");
    const { className, children, color, ...contentProps } = extractProps(
      // Pass size value from the context to generate styles
      { size: context?.size, ...props },
      // Pass size prop def to allow it to be extracted
      { size: rootPropDefs.size },
      contentPropDefs,
    );
    const themeContext = useThemeContext();
    const resolvedColor = color || themeContext.accentColor;
    return (
      <ComboboxPrimitive.Content
        ref={ref}
        data-accent-color={resolvedColor}
        {...contentProps}
        className={classNames(className, "ComboboxContent")}
      >
        {children}
      </ComboboxPrimitive.Content>
    );
  },
);

interface ComboboxScrollAreaProps extends Omit<ScrollAreaPrimitive.ScrollAreaProps, "asChild"> {
  maxItems?: number;
}

const ComboboxScrollArea = React.forwardRef<HTMLDivElement, ComboboxScrollAreaProps>(
  function ComboboxContent(props, ref) {
    const { className, children, type = "hover", maxItems = 6, ...scrollAreaProps } = props;
    const { inputElement, open } = ComboboxPrimitive.useComboboxContext();

    // When the user scrolls with the pointer on the scroll area's scrollbar
    // element, we need to re-focus the input element so that the user can
    // continue typing immediately when they release the pointer.
    const isScrollingRef = React.useRef(false);

    const focusInput = useEffectEvent(() => {
      if (!inputElement || !isScrollingRef.current) {
        return;
      }

      isScrollingRef.current = false;
      const window = inputElement.ownerDocument?.defaultView ?? globalThis.window;
      inputElement?.focus({ preventScroll: true });
      window.removeEventListener("pointerup", focusInput);
      window.removeEventListener("pointercancel", focusInput);
      window.removeEventListener("lostpointercapture", focusInput);
    });

    React.useEffect(() => {
      if (!open) {
        return;
      }

      window.addEventListener("pointerup", focusInput);
      window.addEventListener("pointercancel", focusInput);
      window.addEventListener("lostpointercapture", focusInput);
      return () => {
        isScrollingRef.current = false;
        window.removeEventListener("pointerup", focusInput);
        window.removeEventListener("pointercancel", focusInput);
        window.removeEventListener("lostpointercapture", focusInput);
      };
    }, [focusInput, open]);

    return (
      // TODO: debug scrollbar (shouldn't show up if the content fits)
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={classNames("ComboboxScrollArea rt-ScrollAreaRoot", className)}
        type={type}
        {...scrollAreaProps}
        style={{
          "--combobox-scroll-area-max-items": maxItems,
          ...scrollAreaProps.style,
        }}
      >
        <ScrollAreaPrimitive.Viewport
          className="ComboboxViewport rt-ScrollAreaViewport"
          tabIndex={-1}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar
          forceMount
          className="rt-ScrollAreaScrollbar rt-r-size-1"
          orientation="vertical"
          onLostPointerCapture={focusInput}
          onPointerCancel={focusInput}
          onPointerDown={() => (isScrollingRef.current = true)}
          onPointerUp={focusInput}
        >
          <ScrollAreaPrimitive.Thumb className="rt-ScrollAreaThumb" />
        </ScrollAreaPrimitive.Scrollbar>
      </ScrollAreaPrimitive.Root>
    );
  },
);

type ComboboxHeaderProps = React.ComponentPropsWithoutRef<typeof Flex>;

const ComboboxHeader = React.forwardRef<HTMLDivElement, ComboboxHeaderProps>(
  function ComboboxHeader(props, ref) {
    const { className, children, ...domProps } = props;
    return (
      <Flex
        ref={ref}
        className={classNames("ComboboxHeader", className)}
        direction="column"
        {...domProps}
      >
        {children}
      </Flex>
    );
  },
);

type ComboboxFooterProps = React.ComponentPropsWithoutRef<typeof Flex>;

const ComboboxFooter = React.forwardRef<HTMLDivElement, ComboboxFooterProps>(
  function ComboboxFooter(props, ref) {
    const { className, children, ...domProps } = props;
    return (
      <Flex
        ref={ref}
        className={classNames("ComboboxFooter", className)}
        direction="column"
        {...domProps}
      >
        {children}
      </Flex>
    );
  },
);

interface ComboboxItemProps extends Omit<
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Item>,
  "asChild"
> {
  indicatorPosition?: "start" | "end" | "none";
}

const ComboboxItem = React.forwardRef<HTMLDivElement, ComboboxItemProps>(
  function ComboboxItem(props, ref) {
    const { className, children, indicatorPosition: indicatorPositionProp, ...itemProps } = props;
    const { selectionType } = ComboboxPrimitive.useComboboxContext();
    const defaultIndicatorPosition = selectionType === "multiple" ? "start" : "end";
    const indicatorPosition = indicatorPositionProp ?? defaultIndicatorPosition;
    return (
      <Flex
        asChild
        align="center"
        gap="2"
        justify={indicatorPosition === "end" ? "between" : "start"}
      >
        <ComboboxPrimitive.Item
          ref={ref}
          {...itemProps}
          className={classNames(className, "ComboboxItem")}
        >
          {indicatorPosition === "start" && <ComboboxItemIndicator />}
          <Slot.Slottable>{children}</Slot.Slottable>
          {indicatorPosition === "end" && <ComboboxItemIndicator />}
        </ComboboxPrimitive.Item>
      </Flex>
    );
  },
);

interface ComboboxItemIndicatorContextValue {
  isSelected: boolean;
  disabled: boolean;
  selectionType: Exclude<ComboboxPrimitive.ComboboxProps["selectionType"], undefined>;
}

const [ComboboxItemIndicatorProvider, useComboboxItemIndicatorContext] =
  createContext<ComboboxItemIndicatorContextValue>("WorkDS.ComboboxItemIndicatorContext", {
    isSelected: false,
    disabled: false,
    selectionType: "single",
  });

type ComboboxItemIndicatorProps = Omit<
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.ItemIndicator>,
  "children" | "asChild"
>;

const ComboboxItemIndicator = React.forwardRef<HTMLElement, ComboboxItemIndicatorProps>(
  function ComboboxItemIndicator(props, ref) {
    const { className, render, ...indicatorProps } = props;
    return (
      <ComboboxPrimitive.ItemIndicator
        ref={ref}
        render={(context) => {
          if (render) {
            return render(context);
          }

          switch (context.selectionType) {
            case "single":
              return (
                <ComboboxItemIndicatorProvider {...context}>
                  <ComboboxItemIndicatorIcon
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                    {...(indicatorProps as React.ComponentPropsWithoutRef<"svg">)}
                  />
                </ComboboxItemIndicatorProvider>
              );
            case "multiple":
              return (
                <ComboboxItemIndicatorProvider {...context}>
                  <ComboboxItemIndicatorCheckbox
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                    {...(indicatorProps as ComboboxItemIndicatorCheckboxProps)}
                    className={classNames("ComboboxItemIndicatorCheckbox", className)}
                  />
                </ComboboxItemIndicatorProvider>
              );
            default:
              return unreachable(context.selectionType);
          }
        }}
      />
    );
  },
);

type ComboboxItemIndicatorIconElement = SVGSVGElement;
interface ComboboxItemIndicatorIconProps extends ComponentPropsWithout<
  "svg",
  "color" | "defaultValue" | "children" | "defaultChecked" | "checked"
> {
  checked?: boolean;
  disabled?: boolean;
}

const ComboboxItemIndicatorIcon = React.forwardRef<
  ComboboxItemIndicatorIconElement,
  ComboboxItemIndicatorIconProps
>(function ComboboxItemIndicatorIcon(props, forwardedRef) {
  const itemContext = useComboboxItemIndicatorContext("Combobox.ItemIndicatorIcon");
  const { className, checked: checkedProp, disabled: disabledProp, ...indicatorProps } = props;
  const checked = checkedProp ?? itemContext.isSelected;
  const disabled = disabledProp ?? itemContext.disabled;
  if (!checked) {
    return null;
  }

  return (
    <CheckIcon
      ref={forwardedRef}
      className={classNames("ComboboxItemIndicatorIcon", className)}
      data-disabled={disabled}
      data-selection-type={itemContext.selectionType}
      {...indicatorProps}
    />
  );
});

type ComboboxItemIndicatorCheckboxElement = HTMLSpanElement;
interface ComboboxItemIndicatorCheckboxProps
  extends
    ComponentPropsWithout<
      typeof Primitive.span,
      "asChild" | "color" | "defaultValue" | "children" | "defaultChecked" | "checked"
    >,
    MarginProps,
    CheckboxOwnProps {
  checked?: boolean;
  disabled?: boolean;
}

const ComboboxItemIndicatorCheckbox = React.forwardRef<
  ComboboxItemIndicatorCheckboxElement,
  ComboboxItemIndicatorCheckboxProps
>(function ComboboxItemIndicatorCheckbox(props, forwardedRef) {
  const itemContext = useComboboxItemIndicatorContext("Combobox.ItemIndicatorCheckbox");
  const {
    className,
    color,
    checked: checkedProp,
    disabled: disabledProp,
    ...checkboxProps
  } = extractProps(props, checkboxPropDefs, marginPropDefs);
  const checked = checkedProp ?? itemContext.isSelected;
  const disabled = disabledProp ?? itemContext.disabled;
  return (
    <Primitive.span
      aria-hidden
      data-accent-color={color}
      {...checkboxProps}
      ref={forwardedRef}
      asChild={false}
      data-disabled={disabled ? "" : undefined}
      data-selection-type={itemContext.selectionType}
      data-state={getSelectionState(checked)}
      className={classNames(
        "rt-reset",
        "rt-BaseCheckboxRoot",
        "rt-CheckboxRoot",
        "ComboboxItemIndicatorCheckbox",
        className,
      )}
    >
      <Presence.Presence present={checked}>
        <Primitive.svg
          asChild
          className="rt-BaseCheckboxIndicator rt-CheckboxIndicator ComboboxItemIndicator"
          data-disabled={disabled ? "" : undefined}
          data-state={getSelectionState(checked)}
          style={{ pointerEvents: "none", ...props.style }}
        >
          <ThickCheckIcon />
        </Primitive.svg>
      </Presence.Presence>
    </Primitive.span>
  );
});

interface ComboboxActionItemProps extends React.ComponentPropsWithoutRef<
  typeof ComboboxPrimitive.Item
> {
  external?: boolean;
  preventSelect?: boolean;
}

const ComboboxActionItem = React.forwardRef<HTMLDivElement, ComboboxActionItemProps>(
  function ComboboxActionItem(props, forwardedRef) {
    const { className, children, asChild, external: externalProp, ...itemProps } = props;
    const [node, setNode] = React.useState<HTMLElement | null>(null);
    const isExternalLink = externalProp ?? isExternalHref(node);
    const composedRefs = useComposedRefs(forwardedRef, setNode);
    const Wrapper = asChild ? Slot.Slottable : React.Fragment;
    return (
      <Flex asChild align="center" gap="2" justify="between">
        <ComboboxPrimitive.Item
          ref={composedRefs}
          asChild={asChild}
          {...itemProps}
          className={classNames("ComboboxActionItem ComboboxItem", "rt-reset", className)}
        >
          <Wrapper>{children}</Wrapper>
          {isExternalLink && <ExternalLinkIcon aria-hidden className="ComboboxActionItemIcon" />}
        </ComboboxPrimitive.Item>
      </Flex>
    );
  },
);

interface ComboboxLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  children?: React.ReactNode;
  asChild?: boolean;
}

const ComboboxLabel = React.forwardRef<HTMLLabelElement, ComboboxLabelProps>(
  function ComboboxLabel(props, ref) {
    const { asChild, className, children, ...labelProps } = props;
    return (
      <ComboboxPrimitive.Label
        ref={ref}
        {...labelProps}
        asChild
        className={classNames("ComboboxLabel", className)}
      >
        {asChild ? children : <Label>{children}</Label>}
      </ComboboxPrimitive.Label>
    );
  },
);

type ComboboxSeparatorElement = React.ElementRef<typeof ComboboxPrimitive.Separator>;
type ComboboxSeparatorProps = ComponentPropsWithout<
  typeof ComboboxPrimitive.Separator,
  RemovedProps
>;
const ComboboxSeparator = React.forwardRef<ComboboxSeparatorElement, ComboboxSeparatorProps>(
  function ComboboxSeparator(props, forwardedRef) {
    const { className, ...separatorProps } = props;
    return (
      <ComboboxPrimitive.Separator
        ref={forwardedRef}
        className={classNames("ComboboxSeparator", className)}
        {...separatorProps}
      />
    );
  },
);

type ComboboxSelectionListProps = React.ComponentPropsWithoutRef<typeof Flex>;

const ComboboxSelectionList = React.forwardRef<HTMLDivElement, ComboboxSelectionListProps>(
  function ComboboxSelectionList(props, ref) {
    const { children, className, style, ...domProps } = props;
    return (
      <Flex
        ref={ref}
        className={classNames("ComboboxSelectionList", className)}
        gap="1"
        style={{ flexWrap: "wrap", ...style }}
        {...domProps}
      >
        {children}
      </Flex>
    );
  },
);

type ComboboxSelectionListItemProps = Omit<ChipProps, "onRemove"> & {
  value: string;
  onRemove?: (value: string) => void;
};

const ComboboxSelectionListItem = React.forwardRef<HTMLSpanElement, ComboboxSelectionListItemProps>(
  function ComboboxSelectionListItem(props, ref) {
    const {
      children,
      className,
      value,
      onRemove,
      removeLabel = `Remove ${value}`,
      ...domProps
    } = props;
    const ownRef = React.useRef<HTMLSpanElement | null>(null);
    const composedRefs = useComposedRefs(ref, ownRef);
    const context = ComboboxPrimitive.useComboboxContext();
    return (
      <Chip
        ref={composedRefs}
        className={classNames("ComboboxSelectionListItem", className)}
        color="gray"
        removeLabel={removeLabel}
        weight="regular"
        onRemove={
          onRemove &&
          (() => {
            flushSync(() => {
              context.setSelectedValue((selectedValue) => {
                if (Array.isArray(selectedValue)) {
                  return selectedValue.filter((item) => item !== value);
                } else {
                  return null;
                }
              });
              onRemove?.(value);
            });
            if (!ownRef.current) {
              context.inputElement?.focus();
            }
          })
        }
        {...domProps}
      >
        {children}
      </Chip>
    );
  },
);

type ComboboxSelectTriggerProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  "color" | "ghost"
>;

const ComboboxSelectTrigger = React.forwardRef<HTMLButtonElement, ComboboxSelectTriggerProps>(
  function ComboboxSelectTrigger(props, ref) {
    const { className, children, ...buttonProps } = props;
    return (
      <ComboboxTrigger>
        <Button
          ref={ref}
          className={classNames("ComboboxSelectTrigger", className)}
          {...buttonProps}
        >
          {children}

          <ChevronDownIcon />
        </Button>
      </ComboboxTrigger>
    );
  },
);

export {
  ComboboxActionItem as ActionItem,
  ComboboxAnchor as Anchor,
  ComboboxClear as Clear,
  ComboboxContent as Content,
  ComboboxContentBox as ContentBox,
  ComboboxFooter as Footer,
  ComboboxHeader as Header,
  ComboboxInput as Input,
  ComboboxInputSlot as InputSlot,
  ComboboxItem as Item,
  ComboboxItemIndicator as ItemIndicator,
  ComboboxLabel as Label,
  ComboboxPopover as Popover,
  ComboboxRoot as Root,
  ComboboxScrollArea as ScrollArea,
  ComboboxSelectionList as SelectionList,
  ComboboxSelectionListItem as SelectionListItem,
  ComboboxSelectTrigger as SelectTrigger,
  ComboboxSeparator as Separator,
  ComboboxTrigger as Trigger,
};

export type {
  ComboboxActionItemProps,
  ComboboxAnchorProps,
  ComboboxClearProps,
  ComboboxContentProps,
  ComboboxFooterProps,
  ComboboxHeaderProps,
  ComboboxInputProps,
  ComboboxInputSlotProps,
  ComboboxItemIndicatorProps,
  ComboboxItemProps,
  ComboboxLabelProps,
  ComboboxRootProps,
  ComboboxScrollAreaProps,
  ComboboxSelectionListItemProps,
  ComboboxSelectionListProps,
  ComboboxSeparatorProps,
  ComboboxTriggerProps,
};

function unreachable(
  condition: never,
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  message = `Entered unreachable code. Received '${condition}'.`,
): never {
  throw new TypeError(message);
}

const getSelectionState = (checked: boolean) => (checked ? "checked" : "unchecked");

const isAnchorElement = (element: Element): element is HTMLAnchorElement => element.tagName === "A";

function getWindowLocation(node: HTMLElement | null) {
  if (!node) {
    return null;
  }

  try {
    const window = node.ownerDocument?.defaultView ?? globalThis.window;
    return window.location;
  } catch {
    return null;
  }
}

function isExternalHref(node: HTMLElement | null) {
  if (!node) {
    return false;
  }

  const href = isAnchorElement(node) ? node.href : null;
  if (!href) {
    return false;
  }

  const windowLocation = getWindowLocation(node);
  if (!windowLocation || !windowLocation.origin) {
    return false;
  }

  try {
    const url = new URL(href);
    return url.origin !== windowLocation.origin;
  } catch {
    return false;
  }
}
