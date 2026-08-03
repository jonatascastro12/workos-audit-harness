// This file follows Radix coding conventions so that it can be more easily
// ported down the road. Disabling conflicting lint rules here.

/* eslint-disable
     @typescript-eslint/consistent-type-assertions,
     @typescript-eslint/naming-convention,
     @typescript-eslint/no-explicit-any,
     multiline-comment-style,
     simple-import-sort/exports,
*/

// TODOs:
// - Unify typeahead behavior with Radix Select
// - Support selection on pointerup when popover is triggered by pointerdown

"use client";

import {
  type ComboboxItemProps as AriakitComboboxItemProps,
  type ComboboxStore,
  type ComboboxStoreState,
  Combobox as AriakitCombobox,
  ComboboxItem as AriakitComboboxItem,
  ComboboxLabel as AriakitComboboxLabel,
  ComboboxList as AriakitComboboxList,
  ComboboxProvider as AriakitComboboxProvider,
  useComboboxStore as useCreateComboboxStore,
  useStoreState,
} from "@ariakit/react";
import { Label as LabelPrimitive, Popover as PopoverPrimitive } from "radix-ui";
import {
  composeEventHandlers,
  Context as ContextPrimitive,
  // Popper as PopperPrimitive,
  Primitive,
  useComposedRefs,
  useControllableState,
} from "radix-ui/internal";
import * as React from "react";
import { flushSync } from "react-dom";
import { addScrollendEventListener } from "../helpers/scrollend.js";

type Direction = "ltr" | "rtl";
type Orientation = "horizontal" | "vertical";
type ComboboxSelectionType = "single" | "multiple";

const COMBOBOX_NAME = "Combobox";
const OPEN_KEYS = [" ", "Enter", "ArrowUp", "ArrowDown"];

type ScopedProps<P> = P & { __scopeCombobox?: ContextPrimitive.Scope };

const [createComboboxContext, _createComboboxScope] = ContextPrimitive.createContextScope(
  COMBOBOX_NAME,
  [
    // CollectionPrimitive.createCollectionScope,
    // PopperPrimitive.createPopperScope,
  ],
);
// const usePopperScope = PopperPrimitive.createPopperScope();

interface ComboboxContextValue {
  selectionType: ComboboxSelectionType;
  contentElement: HTMLElement | null;
  inputElement: ComboboxInputElement | null;
  setInputElement: (input: ComboboxInputElement | null) => void;
  inputRef: React.RefObject<ComboboxInputElement | null>;
  contentRef: React.RefObject<ComboboxContentElement | null>;
  selectedValue: string | string[] | null;
  value: string;
  open: boolean;
  empty: boolean;
  name: string | undefined;
  disabled: boolean;
  readOnly: boolean;
}

const [ComboboxProvider, useComboboxContext] =
  createComboboxContext<ComboboxContextValue>(COMBOBOX_NAME);

const [ComboboxStoreProvider, useComboboxStore] = createComboboxContext<{
  store: ComboboxStore;
}>(COMBOBOX_NAME);

/* -------------------------------------------------------------------------------------------------
 * Combobox
 * -----------------------------------------------------------------------------------------------*/

interface ControlledComboboxMultiSelectValueProps {
  selectedValue: string[];
  defaultSelectedValue?: never;
  onSelectedValueChange: (values: string[]) => void;
}

interface UncontrolledComboboxMultiSelectValueProps {
  selectedValue?: never;
  defaultSelectedValue?: string[];
  onSelectedValueChange?: (values: string[]) => void;
}

type ComboboxMultiSelectValueProps =
  | ControlledComboboxMultiSelectValueProps
  | UncontrolledComboboxMultiSelectValueProps;

interface ControlledComboboxSingleSelectValueProps {
  selectedValue: string | null;
  defaultSelectedValue?: never;
  onSelectedValueChange: (value: string | null) => void;
}

interface UncontrolledComboboxSingleSelectValueProps {
  selectedValue?: never;
  defaultSelectedValue?: string | null;
  onSelectedValueChange?: {
    (value: string): void;
    (value: string | null): void;
  };
}

type ComboboxSingleSelectValueProps =
  | ControlledComboboxSingleSelectValueProps
  | UncontrolledComboboxSingleSelectValueProps;

type ComboboxSelectValueProps =
  | ({ selectionType?: "single" } & ComboboxSingleSelectValueProps)
  | ({ selectionType: "multiple" } & ComboboxMultiSelectValueProps);

interface ControlledComboboxInputValueProps {
  value: string;
  defaultValue?: never;
  onValueChange: (value: string) => void;
}

interface UncontrolledComboboxInputValueProps {
  value?: never;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

type ComboboxInputValueProps =
  | ControlledComboboxInputValueProps
  | UncontrolledComboboxInputValueProps;

interface ControlledComboboxOpenStateProps {
  open: boolean;
  defaultOpen?: never;
  onOpenChange: (open: boolean) => void;
}

interface UncontrolledComboboxOpenStateProps {
  open?: never;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type ComboboxOpenStateProps = ControlledComboboxOpenStateProps | UncontrolledComboboxOpenStateProps;

// Ariakit allows users to manage the `active` state (which option is
// highlighted in the list) but doesn't use the item's "value", rather they use
// the DOM id. This is because some items in the list may not have a value if
// they are actions and cannot be selected. This makes things a little less
// consistent, and I'm unsure if we want to follow the same pattern or deviate
// and require values in all cases. Marking these props as unstable for now
// until we decide, but we need some way for consumers to control the active
// item state.
interface ControlledComboboxActiveIdStateProps {
  unstable_activeId: string | null;
  unstable_defaultActiveId?: never;
  unstable_onActiveIdChange: (id: string | null) => void;
}

interface UncontrolledComboboxActiveIdStateProps {
  unstable_activeId?: never;
  unstable_defaultActiveId?: string | null;
  unstable_onActiveIdChange?: (id: string | null) => void;
}

type ComboboxActiveIdStateProps =
  | ControlledComboboxActiveIdStateProps
  | UncontrolledComboboxActiveIdStateProps;

interface ComboboxSharedProps {
  id?: string;
  children?: React.ReactNode;
  dir?: Direction;
  orientation?: Orientation;
  side?: "top" | "bottom" | "left" | "right";
  clearOnHide?: boolean;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  /**
   * Whether pressing arrow down on the last item should loop back to the first,
   * and pressing arrow up on the first item should loop to the last.
   * @default false
   */
  focusLoop?: boolean;
}

type ComboboxProps = ComboboxSharedProps &
  ComboboxSelectValueProps &
  ComboboxInputValueProps &
  ComboboxOpenStateProps &
  ComboboxActiveIdStateProps;

const Combobox: React.FC<ComboboxProps> = ({
  __scopeCombobox,
  id,
  side = "bottom",
  dir = "ltr",
  orientation = "vertical",
  selectionType = "single",
  children,
  clearOnHide = false,
  disabled = false,
  readOnly = false,
  name,
  focusLoop = false,
  // selectedValue state props
  selectedValue: selectedValueProp,
  defaultSelectedValue,
  onSelectedValueChange,
  // value state props
  value: valueProp,
  onValueChange,
  defaultValue,
  // open state props
  open: openProp,
  defaultOpen,
  onOpenChange,
  // active id state props
  unstable_activeId: activeIdProp,
  unstable_defaultActiveId: defaultActiveId,
  unstable_onActiveIdChange: onActiveIdChange,
}: ScopedProps<ComboboxProps>) => {
  validateSelectedValueProps(selectionType, selectedValueProp, defaultSelectedValue);

  const _defaultSelectedValue: undefined | string | string[] =
    selectionType === "multiple" ? [] : undefined;

  // Ariakit doesn't have an explicit prop for multi-selection; it is inferred
  // based on whether or not an array is passed as the selected value.
  // Unfortunately this forces the consumer to control the selected value state,
  // which we don't necessarily do.
  const [selectedValue = selectionType === "multiple" ? [] : null, setSelectedValue] =
    useControllableState({
      defaultProp: defaultSelectedValue ?? _defaultSelectedValue,
      prop: selectedValueProp === null ? "" : selectedValueProp,
      onChange: onSelectedValueChange as any,
    });

  const setActiveId = React.useCallback(
    (id: string | null | undefined) => {
      // Ariakit may callback with `null` or `undefined` but we always want the
      // signature to match the accepted type of the activeId prop.
      onActiveIdChange?.(id ?? null);
    },
    [onActiveIdChange],
  );

  const combobox = useCreateComboboxStore({
    activeId: activeIdProp,
    defaultActiveId,
    setActiveId,
    value: valueProp,
    setValue: onValueChange,
    defaultValue,
    // Ariakit's types do not support `null` values for `selectedValue` but it
    // is actually OK at runtime, and it's more semantically logical than using
    // an empty string.
    selectedValue: selectedValue as any,
    setSelectedValue,
    open: openProp,
    setOpen: onOpenChange,
    defaultOpen,
    //
    focusLoop,
    includesBaseElement: false,
    orientation,
    rtl: dir === "rtl",
    id,
    placement: side,
    resetValueOnHide: clearOnHide,
    // TODO: Test virtual focus behavior in VoicceOver (uses
    // aria-activedescendant which has been buggy in the past)
    virtualFocus: true,
  });

  const value = useStoreState(combobox, (state) => state.value);
  const open = useStoreState(combobox, (state) => state.open);
  const contentElement = useStoreState(combobox, (state) => state.contentElement);

  const inputRef = React.useRef<ComboboxInputElement | null>(null);
  const contentRef = React.useRef<ComboboxContentElement | null>(null);
  const [inputElement, setInputElement] = React.useState<ComboboxInputElement | null>(null);
  return (
    <ComboboxProvider
      scope={__scopeCombobox}
      contentRef={contentRef}
      contentElement={contentElement}
      inputRef={inputRef}
      inputElement={inputElement}
      setInputElement={setInputElement}
      selectionType={selectionType}
      value={value}
      open={open}
      empty={value === ""}
      selectedValue={selectedValue}
      name={name}
      disabled={disabled}
      readOnly={readOnly}
    >
      <ComboboxStoreProvider scope={__scopeCombobox} store={combobox}>
        <AriakitComboboxProvider store={combobox}>
          <ComboboxImpl scope={__scopeCombobox}>{children}</ComboboxImpl>
        </AriakitComboboxProvider>
      </ComboboxStoreProvider>
    </ComboboxProvider>
  );
};

Combobox.displayName = COMBOBOX_NAME;

const ComboboxImpl: React.FC<{
  scope: ContextPrimitive.Scope;
  children: React.ReactNode;
}> = ({ scope, children }) => {
  const { store } = useComboboxStore(COMBOBOX_NAME, scope);
  const { open } = useComboboxContext(COMBOBOX_NAME, scope);
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={store.setOpen}>
      {children}
    </PopoverPrimitive.Root>
  );
};

ComboboxImpl.displayName = `${COMBOBOX_NAME}Impl`;

/* -------------------------------------------------------------------------------------------------
 * ComboboxAnchor
 * -----------------------------------------------------------------------------------------------*/

const ANCHOR_NAME = "ComboboxAnchor";
type ComboboxAnchorElement = HTMLDivElement;

type PrimitiveAnchorProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.PopoverAnchor>;
type ComboboxAnchorProps = PrimitiveAnchorProps;

const ComboboxAnchor = React.forwardRef<ComboboxAnchorElement, ComboboxAnchorProps>(
  (props: ScopedProps<ComboboxInputProps>, forwardedRef) => {
    const { __scopeCombobox, children, ...anchorProps } = props;
    // const popperScope = usePopperScope(__scopeCombobox);
    return (
      <PopoverPrimitive.Anchor
        {...anchorProps}
        ref={forwardedRef}
        //  {...popperScope}
      >
        {children}
      </PopoverPrimitive.Anchor>
    );
  },
);

ComboboxAnchor.displayName = ANCHOR_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxInput
 * -----------------------------------------------------------------------------------------------*/

const INPUT_NAME = "ComboboxInput";
type ComboboxInputElement = HTMLInputElement;

interface ComboboxInputContextValue {
  disabled: boolean;
  name: string | undefined;
  readOnly: boolean;
}

const [ComboboxInputProvider, useComboboxInputContext] =
  createComboboxContext<ComboboxInputContextValue>(INPUT_NAME, {
    disabled: false,
    name: undefined,
    readOnly: false,
  });

type PrimitiveInputProps = React.ComponentPropsWithoutRef<typeof Primitive.input>;
interface ComboboxInputOwnProps {
  autoSelect?: boolean;
}
interface ComboboxInputProps
  extends ComboboxInputOwnProps, Omit<PrimitiveInputProps, keyof ComboboxInputOwnProps> {}

const ComboboxInput = React.forwardRef<ComboboxInputElement, ComboboxInputProps>(
  (props: ScopedProps<ComboboxInputProps>, forwardedRef) => {
    const {
      __scopeCombobox,
      asChild,
      autoSelect = true,
      name: nameProp,
      onKeyDown,
      ...inputProps
    } = props;
    const {
      empty,
      inputRef,
      setInputElement: setInput,
      name: comboboxName,
      open,
    } = useComboboxContext(INPUT_NAME, __scopeCombobox);
    const { store } = useComboboxStore(INPUT_NAME, __scopeCombobox);
    const composedRefs = useComposedRefs(forwardedRef, inputRef, setInput);
    const name = nameProp ?? comboboxName;
    const popoverContext = useComboboxPopoverContext(INPUT_NAME, __scopeCombobox);
    const isInPopover = popoverContext !== null;

    const setValue = store.setValue;
    React.useEffect(() => {
      if (!isInPopover) {
        return;
      }

      // reset the value
      if (open) {
        inputRef.current?.focus();
      } else {
        setValue("");
      }
    }, [inputRef, isInPopover, open, setValue]);

    // Prevent implicit form submission when Enter is pressed while the popover
    // is open. Ariakit's composite keyboard proxy dispatches a synthetic click on
    // the active item (which handles selection/ActionItem invocation) and
    // preventDefaults the original event — but only when an item is active. When
    // no item is active (e.g. empty results), the event would otherwise bubble
    // to an ancestor form.
    const handleKeyDown = composeEventHandlers(onKeyDown, (event) => {
      const isModifierPressed = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      if (open && event.key === "Enter" && !isModifierPressed) {
        event.preventDefault();
      }
    });

    return (
      <AriakitCombobox
        ref={composedRefs}
        autoSelect={autoSelect}
        name={name}
        onKeyDown={handleKeyDown}
        {...inputProps}
        render={(props) => (
          <ComboboxInputProvider
            scope={__scopeCombobox}
            disabled={inputProps.disabled || false}
            readOnly={inputProps.readOnly || false}
            name={name}
          >
            <Primitive.input
              {...props}
              data-empty={empty || undefined}
              data-within-popover={isInPopover || undefined}
              asChild={asChild}
            />
          </ComboboxInputProvider>
        )}
        store={store}
      />
    );
  },
);

ComboboxInput.displayName = INPUT_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxClear
 * -----------------------------------------------------------------------------------------------*/

const CLEAR_NAME = "ComboboxClear";
type ComboboxClearElement = HTMLButtonElement;

type PrimitiveButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>;
type AcceptableButtonProps = Omit<PrimitiveButtonProps, "type"> & {
  type?: "button" | "submit" | "reset" | null;
};
interface ComboboxClearOwnProps {
  render?: (
    context: { empty: boolean; disabled: boolean; open: boolean },
    props: React.ComponentPropsWithRef<"button">,
  ) => React.ReactNode;
}
interface ComboboxClearProps
  extends ComboboxClearOwnProps, Omit<AcceptableButtonProps, keyof ComboboxClearOwnProps> {}

const ComboboxClear = React.forwardRef<ComboboxClearElement, ComboboxClearProps>(
  (props: ScopedProps<ComboboxClearProps>, forwardedRef) => {
    const {
      __scopeCombobox,
      "aria-label": ariaLabel = "Clear input",
      onClick,
      render,
      asChild,
      disabled: disabledProp = false,
      ...buttonProps
    } = props;
    const context = useComboboxContext(CLEAR_NAME, __scopeCombobox);
    const { empty, inputElement, open } = context;

    const { store } = useComboboxStore(CLEAR_NAME, __scopeCombobox);
    const inputId = inputElement?.id;
    const inputContext = useComboboxInputContext(CLEAR_NAME, __scopeCombobox);
    const disabled =
      empty ||
      context.disabled ||
      context.readOnly ||
      inputContext.disabled ||
      inputContext.readOnly ||
      disabledProp ||
      false;

    const renderProps: RenderProps<"button"> = {
      "aria-controls": inputId,
      "aria-label": ariaLabel,
      "data-empty": empty || undefined,
      disabled: disabled || undefined,
      tabIndex: disabled ? -1 : 0,
      ref: forwardedRef,
      ...buttonProps,
      onClick: composeEventHandlers(props.onClick, () => {
        if (disabled) {
          return;
        }

        store?.setValue("");
        // Move focus to the combobox input.
        store?.move(null);
      }),
      type: "button",
    };

    if (render) {
      return render({ empty, disabled, open }, renderProps);
    }

    return <Primitive.button asChild={asChild} {...renderProps} />;
  },
);

ComboboxClear.displayName = CLEAR_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = "ComboboxTrigger";
type ComboboxTriggerElement = HTMLButtonElement;

interface ComboboxTriggerOwnProps {
  returnFocusOnClose?: boolean;
  render?: (
    context: { empty: boolean; disabled: boolean; open: boolean },
    props: React.ComponentPropsWithRef<"button">,
  ) => React.ReactNode;
}
interface ComboboxTriggerProps
  extends ComboboxTriggerOwnProps, Omit<AcceptableButtonProps, keyof ComboboxTriggerOwnProps> {}

const ComboboxTrigger = React.forwardRef<ComboboxTriggerElement, ComboboxTriggerProps>(
  (props: ScopedProps<ComboboxTriggerProps>, forwardedRef) => {
    const {
      __scopeCombobox,
      "aria-label": ariaLabel,
      onClick,
      onKeyDown,
      onMouseDown,
      onPointerDown,
      render,
      asChild,
      disabled: disabledProp,
      returnFocusOnClose = true,
      ...buttonProps
    } = props;

    const { store } = useComboboxStore(TRIGGER_NAME, __scopeCombobox);
    const context = useComboboxContext(TRIGGER_NAME, __scopeCombobox);
    const disabled = context.disabled || disabledProp || false;
    const triggerRef = React.useRef<ComboboxTriggerElement | null>(null);
    const ref = useComposedRefs(forwardedRef, triggerRef);
    const pointerTypeRef = React.useRef<React.PointerEvent["pointerType"]>("touch");
    const preventRefocus = React.useRef(false);
    const prevOpenRef = React.useRef(context.open);

    const handleOpen = () => {
      if (!disabled) {
        flushSync(() => store.setOpen(true));
        store.move(null);
      }
    };

    const renderProps: RenderProps<"button"> = {
      "aria-expanded": context.open,
      "aria-label": ariaLabel ?? (context.open ? "Hide suggestions" : "Show suggestions"),
      "aria-haspopup": "listbox",
      disabled: disabled || undefined,
      tabIndex: -1,
      ref,
      ...buttonProps,
      onClick: composeEventHandlers(onClick, (event) => {
        if (disabled) {
          return;
        }

        // Whilst browsers generally have no issue focusing the trigger when
        // clicking on a label, Safari seems to struggle with the fact that
        // there's no `onClick`. We force `focus` in this case. Open on click when
        // using a touch or pen device
        if (!preventRefocus.current && pointerTypeRef.current !== "mouse") {
          event.currentTarget.focus();
          handleOpen();
        }
      }),
      onKeyDown: composeEventHandlers(onKeyDown, (event) => {
        if (disabled) {
          return;
        }

        if (OPEN_KEYS.includes(event.key)) {
          event.preventDefault();
          handleOpen();
        }
      }),
      onPointerDown: composeEventHandlers(onPointerDown, (event) => {
        if (disabled) {
          return;
        }

        pointerTypeRef.current = event.pointerType;

        // prevent implicit pointer capture
        // https://www.w3.org/TR/pointerevents3/#implicit-pointer-capture
        const target = event.target as HTMLElement;
        if (target.hasPointerCapture(event.pointerId)) {
          target.releasePointerCapture(event.pointerId);
        }

        // only call handler if it's the left button (mousedown gets triggered by
        // all mouse buttons) but not when the control key is pressed (avoiding
        // MacOS right click); also not for touch devices because that would open
        // the menu on scroll. (pen devices behave as touch on iOS).
        if (event.button === 0 && !event.ctrlKey && event.pointerType === "mouse") {
          preventRefocus.current = true;
          // prevent trigger from stealing focus from the input after
          // opening.
          event.preventDefault();
          handleOpen();
        }
      }),
      type: "button",
    };

    React.useEffect(() => {
      const wasOpen = prevOpenRef.current;
      prevOpenRef.current = context.open;

      // Only focus if we were open and are now closed (not on initial mount)
      if (returnFocusOnClose && wasOpen && !context.open) {
        triggerRef?.current?.focus();
      }
    }, [returnFocusOnClose, context.open]);

    if (render) {
      return render({ empty: context.empty, disabled, open: context.open }, renderProps);
    }

    return <Primitive.button asChild={asChild} {...renderProps} />;
  },
);

ComboboxTrigger.displayName = TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxPortal
 * -----------------------------------------------------------------------------------------------*/

const PORTAL_NAME = "ComboboxPortal";

type PrimitivePortalProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Portal>;
interface ComboboxPortalOwnProps {}
interface ComboboxPortalProps
  extends ComboboxPortalOwnProps, Omit<PrimitivePortalProps, keyof ComboboxPortalOwnProps> {}

const ComboboxPortal = (props: ScopedProps<ComboboxPortalProps>) => {
  const { __scopeCombobox, children, ...popoverProps } = props;
  return <PopoverPrimitive.Portal {...popoverProps}>{children}</PopoverPrimitive.Portal>;
};

ComboboxPortal.displayName = PORTAL_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxPopover
 * -----------------------------------------------------------------------------------------------*/

const POPOVER_NAME = "ComboboxPopover";
type ComboboxPopoverElement = HTMLDivElement;

interface ComboboxPopoverContextValue {
  open: boolean;
}

const [ComboboxPopoverProvider, useComboboxPopoverContext] =
  createComboboxContext<ComboboxPopoverContextValue | null>(POPOVER_NAME, null);

type PrimitivePopoverProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;
interface ComboboxPopoverOwnProps {}
interface ComboboxPopoverProps
  extends ComboboxPopoverOwnProps, Omit<PrimitivePopoverProps, keyof ComboboxPopoverOwnProps> {}

const ComboboxPopover = React.forwardRef<ComboboxPopoverElement, ComboboxPopoverProps>(
  (props: ScopedProps<ComboboxPopoverProps>, forwardedRef) => {
    const { __scopeCombobox, children, ...popoverProps } = props;
    const { store } = useComboboxStore(POPOVER_NAME, undefined);
    const context = useComboboxContext(POPOVER_NAME, __scopeCombobox);
    const popoverRef = React.useRef<ComboboxPopoverElement | null>(null);
    const composedRefs = useComposedRefs(popoverRef, forwardedRef);

    const { open } = context;
    const { setOpen } = store;

    React.useEffect(() => {
      const popover = popoverRef.current;
      if (!popover || !open) {
        return;
      }

      let mouseCoordinates: { clientX: number; clientY: number } | null;
      let timeout: number | null = null;

      const onWheel = (event: WheelEvent) => {
        const { clientX, clientY } = event;
        mouseCoordinates = { clientX, clientY };
        timeout = window.setTimeout(() => {
          mouseCoordinates = null;
          timeout = null;
        }, 500);
      };

      const onScroll = (event: Event) => {
        if (!popover.contains(event.target as Element)) {
          // if the pointer is over the popover, when scroll is triggered by the
          // wheel, quickly scrolling to the end of the list will trigger scroll
          // on the closest scrollable parent, and abruptly close the popover.
          // Preventing this is a slightly better UX.
          if (mouseCoordinates && timeout !== null) {
            const elementFromPointer = popover.ownerDocument.elementFromPoint(
              mouseCoordinates.clientX,
              mouseCoordinates.clientY,
            );

            if (popover.contains(elementFromPointer)) {
              window.clearTimeout(timeout);
              timeout = null;
              return;
            }
          }

          setOpen(false);
        }
      };

      const onScrollEnd = () => (mouseCoordinates = null);

      const window = popover.ownerDocument.defaultView ?? globalThis.window;
      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("scroll", onScroll);
      addScrollendEventListener(window, onScrollEnd);
      return () => {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("scrollend", onScrollEnd);
        if (timeout !== null) {
          window.clearTimeout(timeout);
        }
      };
    }, [open, setOpen]);

    return (
      <ComboboxPopoverProvider scope={__scopeCombobox} open={context.open}>
        <PopoverPrimitive.Content
          role="none"
          {...popoverProps}
          ref={composedRefs}
          onOpenAutoFocus={composeEventHandlers(props.onOpenAutoFocus, (event) =>
            event.preventDefault(),
          )}
          onInteractOutside={composeEventHandlers(props.onInteractOutside, (event) => {
            const isCombobox = event.target === context.inputRef.current;
            const inListbox =
              !!event.target && context.contentRef.current?.contains(event.target as Element);
            if (isCombobox || inListbox) {
              event.preventDefault();
            }
          })}
          style={{
            "--radix-combobox-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-combobox-content-available-width": "var(--radix-popper-available-width)",
            "--radix-combobox-content-available-height": "var(--radix-popper-available-height)",
            "--radix-combobox-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-combobox-trigger-height": "var(--radix-popper-anchor-height)",
            ...props.style,
          }}
        >
          {children}
        </PopoverPrimitive.Content>
      </ComboboxPopoverProvider>
    );
  },
);

ComboboxPopover.displayName = POPOVER_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "ComboboxContent";

type ComboboxContentElement = HTMLDivElement;
type PrimitiveContentProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface ComboboxContentOwnProps {}
interface ComboboxContentProps
  extends ComboboxContentOwnProps, Omit<PrimitiveContentProps, keyof ComboboxContentOwnProps> {
  alwaysVisible?: boolean;
}

const ComboboxContent = React.forwardRef<ComboboxContentElement, ComboboxContentProps>(
  (props: ScopedProps<ComboboxContentProps>, forwardedRef) => {
    const { __scopeCombobox, children, asChild, ...contentProps } = props;
    const context = useComboboxContext(CONTENT_NAME, __scopeCombobox);
    const { store } = useComboboxStore(CONTENT_NAME, __scopeCombobox);
    const composedRefs = useComposedRefs(forwardedRef, context.contentRef);

    return (
      <AriakitComboboxList
        tabIndex={-1}
        {...contentProps}
        ref={composedRefs}
        render={(props) => <Primitive.div {...props} asChild={asChild} />}
        store={store}
      >
        {children}
      </AriakitComboboxList>
    );
  },
);

ComboboxContent.displayName = CONTENT_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxItem
 * -----------------------------------------------------------------------------------------------*/

const ITEM_NAME = "ComboboxItem";
type ComboboxItemElement = HTMLDivElement;

interface ComboboxItemContextValue {
  value: string | symbol;
  disabled: boolean;
  isSelected: boolean;
}

const [ComboboxItemProvider, useComboboxItemContext] =
  createComboboxContext<ComboboxItemContextValue>(ITEM_NAME);

type PrimitiveItemProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;

interface ComboboxItemOwnProps extends Pick<
  AriakitComboboxItemProps,
  "disabled" | "hideOnClick" | "resetValueOnSelect" | "focusOnHover" | "setValueOnClick"
> {
  value: string;
}

interface ComboboxItemProps
  extends ComboboxItemOwnProps, Omit<PrimitiveItemProps, keyof ComboboxItemOwnProps> {}

const ComboboxItem = React.forwardRef<ComboboxItemElement, ComboboxItemProps>(
  (props: ScopedProps<ComboboxItemProps>, forwardedRef) => {
    const {
      __scopeCombobox,
      children,
      asChild,
      focusOnHover = true,
      disabled,
      ...itemProps
    } = props;
    const { store } = useComboboxStore(ITEM_NAME, __scopeCombobox);
    const isSelected = useStoreState(
      store,
      React.useCallback(
        ({ selectedValue }: ComboboxStoreState) => {
          const isSelected = (
            Array.isArray(selectedValue) ? selectedValue : [selectedValue]
          ).includes(props.value);
          return isSelected;
        },
        [props.value],
      ),
    );
    return (
      <ComboboxItemProvider
        scope={__scopeCombobox}
        isSelected={isSelected}
        disabled={disabled ?? false}
        value={props.value}
      >
        <AriakitComboboxItem
          {...itemProps}
          disabled={disabled}
          focusOnHover={focusOnHover}
          ref={forwardedRef}
          render={(props) => (
            <Primitive.div
              {...props}
              data-selected={isSelected || undefined}
              data-disabled={disabled || undefined}
              data-value={itemProps.value}
              asChild={asChild}
            >
              {children}
            </Primitive.div>
          )}
          store={store}
        />
      </ComboboxItemProvider>
    );
  },
);

ComboboxItem.displayName = ITEM_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxActionItem
 * -----------------------------------------------------------------------------------------------*/

const ACTION_ITEM_NAME = "ComboboxActionItem";
type ComboboxActionItemElement = HTMLDivElement;
type PrimitiveActionItemProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;

interface ComboboxActionItemOwnProps
  extends
    PrimitiveActionItemProps,
    Pick<AriakitComboboxItemProps, "disabled" | "focusOnHover" | "resetValueOnSelect" | "value"> {
  value: string;
}

interface ComboboxActionItemProps
  extends ComboboxActionItemOwnProps, Omit<PrimitiveItemProps, keyof ComboboxActionItemOwnProps> {}

const ComboboxActionItem = React.forwardRef<ComboboxActionItemElement, ComboboxActionItemProps>(
  (props: ScopedProps<ComboboxActionItemProps>, forwardedRef) => {
    const { __scopeCombobox, children, asChild, focusOnHover = true, ...itemProps } = props;
    const { store } = useComboboxStore(ACTION_ITEM_NAME, __scopeCombobox);
    return (
      <ComboboxItemProvider
        scope={__scopeCombobox}
        isSelected={false}
        disabled={props.disabled ?? false}
        value={Symbol.for("combobox-action-item")}
      >
        <AriakitComboboxItem
          {...itemProps}
          focusOnHover={focusOnHover}
          ref={forwardedRef}
          selectValueOnClick={false}
          setValueOnClick={false}
          render={(props) => (
            <Primitive.div
              {...props}
              data-disabled={itemProps.disabled || undefined}
              data-value={itemProps.value}
              asChild={asChild}
            >
              {children}
            </Primitive.div>
          )}
          store={store}
        />
      </ComboboxItemProvider>
    );
  },
);

ComboboxActionItem.displayName = ACTION_ITEM_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxItemIndicator
 * -----------------------------------------------------------------------------------------------*/

const ITEM_INDICATOR_NAME = "ComboboxItemIndicator";

type ComboboxItemIndicatorElement = HTMLSpanElement;
type PrimitiveSpanProps = React.ComponentPropsWithoutRef<typeof Primitive.span>;

type ComboboxItemIndicatorSharedProps = Omit<PrimitiveSpanProps, "children" | "asChild">;

interface ComboboxItemIndicatorRenderProps extends ComboboxItemContextValue {
  selectionType: ComboboxSelectionType;
}

type ComboboxItemIndicatorProps = ComboboxItemIndicatorSharedProps &
  (
    | {
        children?: React.ReactNode;
        asChild?: boolean;
        render?: never;
      }
    | {
        children?: never;
        asChild?: never;
        render: (context: ComboboxItemIndicatorRenderProps) => React.ReactNode;
      }
  );

const ComboboxItemIndicator = React.forwardRef<
  ComboboxItemIndicatorElement,
  ComboboxItemIndicatorProps
>((props: ScopedProps<ComboboxItemIndicatorProps>, forwardedRef) => {
  const { __scopeCombobox, render, ...itemIndicatorProps } = props;
  const context = useComboboxContext(ITEM_INDICATOR_NAME, __scopeCombobox);
  const itemContext = useComboboxItemContext(ITEM_INDICATOR_NAME, __scopeCombobox);

  if (render) {
    return render({ ...itemContext, selectionType: context.selectionType });
  }

  return itemContext.isSelected ? (
    <Primitive.span aria-hidden {...itemIndicatorProps} ref={forwardedRef} />
  ) : null;
});

ComboboxItemIndicator.displayName = ITEM_INDICATOR_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxLabel
 * -----------------------------------------------------------------------------------------------*/

const LABEL_NAME = "ComboboxLabel";
type ComboboxLabelElement = HTMLLabelElement;

type PrimitiveLabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

interface ComboboxLabelOwnProps {}

interface ComboboxLabelProps
  extends PrimitiveLabelProps, Omit<PrimitiveLabelProps, keyof ComboboxLabelOwnProps> {}

const ComboboxLabel = React.forwardRef<ComboboxLabelElement, ComboboxLabelProps>(
  (props: ScopedProps<ComboboxLabelProps>, forwardedRef) => {
    const { __scopeCombobox, children, asChild, ...labelProps } = props;
    const { store } = useComboboxStore(LABEL_NAME, __scopeCombobox);
    return (
      <AriakitComboboxLabel
        {...labelProps}
        ref={forwardedRef}
        render={(props) => (
          <LabelPrimitive.Root {...props} asChild={asChild}>
            {children}
          </LabelPrimitive.Root>
        )}
        store={store}
      />
    );
  },
);

ComboboxLabel.displayName = LABEL_NAME;

/* -------------------------------------------------------------------------------------------------
 * ComboboxSeparator
 * -----------------------------------------------------------------------------------------------*/

const SEPARATOR_NAME = "ComboboxSeparator";

type ComboboxSeparatorElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
type ComboboxSeparatorProps = PrimitiveDivProps;

const ComboboxSeparator = React.forwardRef<ComboboxSeparatorElement, ComboboxSeparatorProps>(
  (props: ScopedProps<ComboboxSeparatorProps>, forwardedRef) => {
    const { __scopeCombobox, ...separatorProps } = props;
    return <Primitive.div aria-hidden {...separatorProps} ref={forwardedRef} />;
  },
);
ComboboxSeparator.displayName = SEPARATOR_NAME;

/* ---------------------------------------------------------------------------------------------- */

interface ComboboxContextPublicValue {
  inputElement: ComboboxInputElement | null;
  open: boolean;
  empty: boolean;
  value: string;
  selectedValue: string | string[] | null;
  setSelectedValue: React.Dispatch<React.SetStateAction<string | string[] | null>>;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectionType: ComboboxSelectionType;
}

function useComboboxContextPublic(args?: { consumerName?: string }): ComboboxContextPublicValue {
  const { consumerName = COMBOBOX_NAME } = args || {};
  const { store } = useComboboxStore(consumerName, undefined);
  const { inputElement, open, empty, value, selectedValue, selectionType } = useComboboxContext(
    consumerName,
    undefined,
  );
  return {
    empty,
    inputElement,
    open,
    selectedValue,
    selectionType,
    setOpen: store.setOpen,
    setSelectedValue: store.setSelectedValue as any,
    setValue: store.setValue,
    value,
  };
}

/* ---------------------------------------------------------------------------------------------- */

function validateSelectedValueProps(
  selectionType: ComboboxSelectionType,
  selectedValue: string | string[] | null | undefined,
  defaultSelectedValue: string | string[] | null | undefined,
) {
  const isControlled = selectedValue !== undefined;
  if (selectionType === "multiple") {
    if (isControlled) {
      if (!Array.isArray(selectedValue)) {
        throw new Error(
          'The `selectedValue` prop must be an array when `selectionType` is "multiple".',
        );
      }
    } else if (defaultSelectedValue !== undefined) {
      if (!Array.isArray(defaultSelectedValue)) {
        throw new Error(
          'The `defaultSelectedValue` prop must be an array when `selectionType` is "multiple".',
        );
      }
    }
  } else {
    if (isControlled) {
      if (Array.isArray(selectedValue)) {
        throw new Error(
          'The `selectedValue` prop must be a single value when `selectionType` is "single".',
        );
      }
    } else if (defaultSelectedValue !== undefined) {
      if (Array.isArray(defaultSelectedValue)) {
        throw new Error(
          'The `defaultSelectedValue` prop must be a single value when `selectionType` is "single".',
        );
      }
    }
  }
}

interface DataAttributes {
  [key: `data-${string}`]: any;
}

type RenderProps<T extends React.ElementType> = React.ComponentPropsWithRef<T> & DataAttributes;

/* ---------------------------------------------------------------------------------------------- */

export {
  // createComboboxScope,
  //
  Combobox,
  ComboboxActionItem,
  ComboboxAnchor,
  ComboboxClear,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPopover,
  ComboboxPortal,
  ComboboxSeparator,
  ComboboxTrigger,
  //
  Combobox as Root,
  ComboboxActionItem as ActionItem,
  ComboboxAnchor as Anchor,
  ComboboxClear as Clear,
  ComboboxContent as Content,
  ComboboxInput as Input,
  ComboboxItem as Item,
  ComboboxItemIndicator as ItemIndicator,
  ComboboxLabel as Label,
  ComboboxPopover as Popover,
  ComboboxPortal as Portal,
  ComboboxSeparator as Separator,
  ComboboxTrigger as Trigger,
  //
  useComboboxContextPublic as useComboboxContext,
};

export type {
  ComboboxProps,
  ComboboxAnchorProps,
  ComboboxClearProps,
  ComboboxInputProps,
  ComboboxPortalProps,
  ComboboxPopoverProps,
  ComboboxContentProps,
  ComboboxItemProps,
  ComboboxActionItemProps,
  ComboboxItemIndicatorProps,
  ComboboxLabelProps,
  ComboboxSeparatorProps,
};
