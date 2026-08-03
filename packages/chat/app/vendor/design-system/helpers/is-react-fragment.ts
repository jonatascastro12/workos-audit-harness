import * as React from "react";

export const isReactFragment = (
  element: React.ReactNode,
): element is React.ReactElement<{ children?: React.ReactNode }, typeof React.Fragment> =>
  React.isValidElement(element) && element.type === React.Fragment;
