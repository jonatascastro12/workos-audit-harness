import * as ThemesDropdownMenu from "@radix-ui/themes/dist/esm/components/dropdown-menu.js";
import * as React from "react";

type DropdownMenuContentProps = React.ComponentPropsWithoutRef<typeof ThemesDropdownMenu.Content>;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof ThemesDropdownMenu.Content>,
  DropdownMenuContentProps
>(({ color = "gray", sideOffset = 5, ...props }, forwardedRef) => (
  <ThemesDropdownMenu.Content
    ref={forwardedRef}
    color={color}
    sideOffset={sideOffset}
    variant="soft"
    {...props}
  />
));

DropdownMenuContent.displayName = "DropdownMenuContent";

export const Root = ThemesDropdownMenu.Root;
export const Trigger = ThemesDropdownMenu.Trigger;
export const TriggerIcon = ThemesDropdownMenu.TriggerIcon;
export const Content = DropdownMenuContent;
export const Label = ThemesDropdownMenu.Label;
export const Item = ThemesDropdownMenu.Item;
export const Group = ThemesDropdownMenu.Group;
export const RadioGroup = ThemesDropdownMenu.RadioGroup;
export const RadioItem = ThemesDropdownMenu.RadioItem;
export const CheckboxItem = ThemesDropdownMenu.CheckboxItem;
export const Sub = ThemesDropdownMenu.Sub;
export const SubTrigger = ThemesDropdownMenu.SubTrigger;
export const SubContent = ThemesDropdownMenu.SubContent;
export const Separator = ThemesDropdownMenu.Separator;
