"use client";
import { useComposedRefs } from "radix-ui/internal";
import * as React from "react";

// This component uses type assertions carefully due to the complexity of typing
// the `as` prop and conflicts with other props.
// oxlint-disable typescript/consistent-type-assertions

type ButtonLikeAs = "span" | "div";
interface ButtonLikeElement {
  div: HTMLDivElement;
  span: HTMLSpanElement;
}

type ButtonLikeProps<T extends ButtonLikeAs> = React.ComponentPropsWithRef<T> & {
  as?: T;
  disabled?: boolean;
  onKeyboardSimulatedClick?: (event: React.KeyboardEvent<ButtonLikeElement[T]>) => void;
};

const ButtonLike = React.forwardRef(function ButtonLikeImpl<T extends ButtonLikeAs = "span">(
  {
    disabled,
    onClick,
    onKeyDown,
    onKeyUp,
    onKeyboardSimulatedClick,
    as: Element = "span" as T,
    ...props
  }: ButtonLikeProps<T>,
  forwardedRef: React.ForwardedRef<ButtonLikeElement[T]>,
) {
  const ownRef = React.useRef<ButtonLikeElement[T]>(null);
  const composedRefs = useComposedRefs(ownRef, forwardedRef);
  return (
    <Element
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={disabled || undefined}
      ref={composedRefs}
      // oxlint-disable-next-line typescript/no-explicit-any
      {...(props as any)}
      autoFocus={false}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        onClick?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled || !ownRef.current) {
          return;
        }

        if (event.key === " ") {
          event.preventDefault();
        } else if (event.key === "Enter") {
          onKeyboardSimulatedClick?.(event);
          if (!event.defaultPrevented) {
            event.preventDefault();
            ownRef.current.click();
          }
        }
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (event.defaultPrevented || disabled || !ownRef.current) {
          return;
        }

        if (event.key === " ") {
          onKeyboardSimulatedClick?.(event);
          if (!event.defaultPrevented) {
            event.preventDefault();
            ownRef.current.click();
          }
        }
      }}
    />
  );
}) as ButtonLikeComponent;

interface ButtonLikeComponent {
  <T extends ButtonLikeAs = "span">(props: ButtonLikeProps<T>): React.ReactNode;
  displayName?: string | undefined;
  readonly $$typeof: symbol;
}

export { type ButtonLikeProps, ButtonLike };
