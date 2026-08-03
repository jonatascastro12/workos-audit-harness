import * as ThemesDataList from "@radix-ui/themes/dist/esm/components/data-list.js";
import * as React from "react";

type DataListLabelProps = React.ComponentPropsWithoutRef<typeof ThemesDataList.Label>;

const DataListLabel = React.forwardRef<
  React.ElementRef<typeof ThemesDataList.Label>,
  DataListLabelProps
>((props, forwardedRef) => <ThemesDataList.Label ref={forwardedRef} width="180px" {...props} />);

DataListLabel.displayName = "DataListLabel";

export const Root = ThemesDataList.Root;
export const Item = ThemesDataList.Item;
export const Label = DataListLabel;
export const Value = ThemesDataList.Value;
