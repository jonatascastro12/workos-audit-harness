import classNames from "classnames";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";

interface RadioRootProps
  extends React.ComponentProps<typeof RadioGroupPrimitive.Root>, MarginProps {}

const RadioRoot = React.forwardRef<HTMLDivElement, RadioRootProps>((props, forwardedRef) => {
  const rootProps = extractProps(props, marginPropDefs);
  return <RadioGroupPrimitive.Root ref={forwardedRef} {...rootProps} />;
});

RadioRoot.displayName = "RadioRoot";

const RadioButton = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentPropsWithRef<typeof RadioGroupPrimitive.Item>, "children">
>(({ className, ...props }, forwardedRef) => (
  <RadioGroupPrimitive.Item
    ref={forwardedRef}
    className={classNames("RadioButton", className, "reset-button")}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="RadioIndicator" />
  </RadioGroupPrimitive.Item>
));

RadioButton.displayName = "RadioButton";

export const Root = RadioRoot;
export const Button = RadioButton;
