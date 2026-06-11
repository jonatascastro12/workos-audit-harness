import { ThickCheckIcon } from "@radix-ui/themes/components/icons";
import * as ThemesSelect from "@radix-ui/themes/dist/esm/components/select.js";
import { Select as SelectPrimitive } from "radix-ui";
import * as React from "react";
import { mergeStyles } from "../helpers/themes.js";

interface SelectTriggerProps extends Omit<
  React.ComponentPropsWithRef<typeof ThemesSelect.Trigger>,
  "variant" | "radius"
> {
  ghost?: boolean;
  highContrast?: boolean;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof ThemesSelect.Trigger>,
  SelectTriggerProps
>(({ ghost, highContrast, style, ...props }, forwardedRef) => {
  const variant = ghost ? "ghost" : "surface";
  return (
    <ThemesSelect.Trigger
      ref={forwardedRef}
      color="gray"
      variant={variant}
      style={mergeStyles(style, {
        color: ghost && !highContrast ? "var(--gray-a11)" : undefined,
      })}
      {...props}
    />
  );
});

SelectTrigger.displayName = "SelectTrigger";

type SelectContentProps = Omit<
  React.ComponentPropsWithRef<typeof ThemesSelect.Content>,
  "color" | "highContrast" | "variant"
>;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof ThemesSelect.Content>,
  SelectContentProps
>((props, forwardedRef) => <ThemesSelect.Content ref={forwardedRef} variant="soft" {...props} />);

SelectContent.displayName = "SelectContent";

type SelectItemProps = Omit<React.ComponentPropsWithRef<typeof SelectPrimitive.Item>, "asChild">;

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  ({ className, children, ...itemProps }, forwardedRef) => (
    <SelectPrimitive.Item
      ref={forwardedRef}
      asChild={false}
      className={`rt-SelectItem ${className || ""}`}
      {...itemProps}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="rt-SelectItemIndicator">
        <ThickCheckIcon className="rt-SelectItemIndicatorIcon" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  ),
);

SelectItem.displayName = "SelectItem";

export const Root = ThemesSelect.Root;
export const Trigger = SelectTrigger;
export const Content = SelectContent;
export const Item = SelectItem;
export const Label = ThemesSelect.Label;
export const Separator = ThemesSelect.Separator;
export const Group = ThemesSelect.Group;
