import classNames from "classnames";
import * as React from "react";
import { Text } from "./text.js";

type TextProps = Omit<
  React.ComponentPropsWithoutRef<typeof Text>,
  "asChild" | "weight" | "size" | "color"
>;

type LabelBaseProps = Omit<React.ComponentPropsWithoutRef<"label">, "color">;

type LabelProps = TextProps & LabelBaseProps;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, as = "label", ...props }, forwardedRef) => (
    <Text
      ref={forwardedRef}
      highContrast
      // Introducing lint rule banning type assertions
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      as={as as "label"}
      className={classNames(className, "Label")}
      color="gray"
      size="2"
      weight="bold"
      {...props}
    >
      {children}
    </Text>
  ),
);

Label.displayName = "Label";

export { Label };
