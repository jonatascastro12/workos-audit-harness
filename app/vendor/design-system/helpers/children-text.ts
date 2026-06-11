import * as React from "react";
import { isReactElement } from "./is-react-element.js";

export const childrenText = (children?: React.ReactNode): string | null => {
  if (isReactElement(children, ["children"])) {
    return childrenText(children.props?.children);
  }

  if (Array.isArray(children)) {
    return children.map(childrenText).flat().filter(Boolean).join("");
  }

  if (typeof children === "string") {
    return children;
  }

  return null;
};
