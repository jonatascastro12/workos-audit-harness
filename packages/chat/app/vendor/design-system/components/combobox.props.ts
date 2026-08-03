import {
  type GetPropDefTypes,
  asChildPropDef,
  colorPropDef,
  heightPropDefs,
  highContrastPropDef,
  PropDef,
  textFieldRootPropDefs,
  widthPropDefs,
} from "../props.js";

const rootSizes = ["1", "2", "3"] as const;
export type RootSize = (typeof rootSizes)[number];

export const rootPropDefs = {
  size: {
    type: "enum",
    className: "rt-r-size",
    values: rootSizes,
    default: "2",
    responsive: true,
  },
} satisfies {
  size: PropDef<RootSize>;
};

const {
  // NOTE: do not extract these if we move this to Radix Themes
  color,
  radius,
  ...validTextFieldRootPropDefs
} = textFieldRootPropDefs;

export const inputPropDefs = {
  ...validTextFieldRootPropDefs,
};

export const popoverPropDefs = {
  ...asChildPropDef,
  width: widthPropDefs.width,
  minWidth: widthPropDefs.minWidth,
  maxWidth: { ...widthPropDefs.maxWidth, default: "480px" },
  ...heightPropDefs,
} satisfies {
  width: PropDef<string>;
  minWidth: PropDef<string>;
  maxWidth: PropDef<string>;
};

const contentVariants = ["solid", "soft"] as const;
export type ContentVariant = (typeof contentVariants)[number];

export const contentPropDefs = {
  variant: {
    type: "enum",
    className: "rt-variant",
    values: contentVariants,
    // NOTE: if this ends up in Radix Themes, default should be 'solid' to match
    // Select defaults
    default: "soft",
  },
  ...colorPropDef,
  ...highContrastPropDef,
} satisfies {
  variant: PropDef<ContentVariant>;
};

const checkboxSizes = ["1", "2", "3"] as const;
const checkboxVariants = ["classic", "surface", "soft"] as const;

export const checkboxPropDefs = {
  size: {
    type: "enum",
    className: "rt-r-size",
    values: checkboxSizes,
    default: "2",
    responsive: true,
  },
  variant: {
    type: "enum",
    className: "rt-variant",
    values: checkboxVariants,
    default: "surface",
  },
  ...colorPropDef,
  ...highContrastPropDef,
} satisfies {
  size: PropDef<(typeof checkboxSizes)[number]>;
  variant: PropDef<(typeof checkboxVariants)[number]>;
};

export type RootOwnProps = GetPropDefTypes<typeof rootPropDefs>;
export type InputOwnProps = GetPropDefTypes<typeof inputPropDefs>;
export type PopoverOwnProps = GetPropDefTypes<typeof popoverPropDefs>;
export type ContentOwnProps = GetPropDefTypes<typeof contentPropDefs>;
export type CheckboxOwnProps = GetPropDefTypes<typeof checkboxPropDefs>;
