import { paddingPropDefs, widthPropDefs } from "../props.js";

const layoutValues = ["auto", "fixed"] as const;
const rowAlign = ["start", "center", "end", "baseline"] as const;

const tableContentPropDefs = {
  layout: {
    type: "enum",
    className: "rt-r-tl",
    values: layoutValues,
    default: undefined,
    responsive: true,
  },
} as const;

const tableRowPropDefs = {
  align: {
    type: "enum",
    className: "rt-r-va",
    values: rowAlign,
    default: undefined,
    responsive: true,
    parseValue: (value: string) =>
      ({
        baseline: "baseline",
        start: "top",
        center: "middle",
        end: "bottom",
      })[value],
  },
} as const;

const justifyValues = ["start", "center", "end"] as const;

const tableCellPropDefs = {
  justify: {
    type: "enum",
    className: "rt-r-ta",
    values: justifyValues,
    default: undefined,
    responsive: true,
    parseValue: (value: string) =>
      ({
        start: "left",
        center: "center",
        end: "right",
      })[value],
  },
  ...widthPropDefs,
  ...paddingPropDefs,
} as const;

export { tableCellPropDefs, tableContentPropDefs, tableRowPropDefs };
