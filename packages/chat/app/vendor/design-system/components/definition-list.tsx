import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";

interface DefinitionListRootProps extends React.ComponentPropsWithRef<"dl">, MarginProps {}

const DefinitionListRoot = React.forwardRef<HTMLDListElement, DefinitionListRootProps>(
  (props, forwardedRef) => {
    const { className, ...rootProps } = extractProps(props, marginPropDefs);
    return (
      <dl
        ref={forwardedRef}
        className={classNames(className, "DefinitionListRoot")}
        {...rootProps}
      />
    );
  },
);

DefinitionListRoot.displayName = "DefinitionListRoot";

const DefinitionListItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={classNames(className, "DefinitionListItem")} {...props} />
  ),
);

DefinitionListItem.displayName = "DefinitionListItem";

const DefinitionListTerm = React.forwardRef<HTMLElement, React.ComponentPropsWithRef<"dt">>(
  ({ className, ...props }, forwardedRef) => (
    <dt ref={forwardedRef} className={classNames(className, "DefinitionListTerm")} {...props} />
  ),
);

DefinitionListTerm.displayName = "DefinitionListTerm";

const DefinitionListDetails = React.forwardRef<HTMLElement, React.ComponentPropsWithRef<"dd">>(
  ({ className, ...props }, forwardedRef) => (
    <dd ref={forwardedRef} className={classNames(className, "DefinitionListDetails")} {...props} />
  ),
);

DefinitionListDetails.displayName = "DefinitionListDetails";

export const Root = DefinitionListRoot;
export const Item = DefinitionListItem;
export const Term = DefinitionListTerm;
export const Details = DefinitionListDetails;
