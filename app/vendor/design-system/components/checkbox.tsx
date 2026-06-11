import { CheckIcon } from "@radix-ui/react-icons";
import classNames from "classnames";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";

interface CheckboxProps extends CheckboxPrimitive.CheckboxProps, MarginProps {}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>((props, forwardedRef) => {
  const { className, style, checked, ...checkboxProps } = extractProps(props, marginPropDefs);
  return (
    <div className={classNames("CheckboxRoot", className)} style={style}>
      <CheckboxPrimitive.Root
        ref={forwardedRef}
        // Resolves bug where indeterminate state is not rendered while maintaining the same api as the Checkbox component
        checked={checked === "indeterminate" || checked}
        className="CheckboxButton"
        {...checkboxProps}
      >
        <CheckboxPrimitive.Indicator className="CheckboxIndicator">
          {checked === "indeterminate" ? (
            <div className="CheckboxIndeterminateContainer">
              <div className="CheckboxIndeterminate" />
            </div>
          ) : (
            <CheckIcon height="16" width="16" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </div>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
