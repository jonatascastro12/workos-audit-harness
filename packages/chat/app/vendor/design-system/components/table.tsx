"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import classNames from "classnames";
import { composeRefs, useComposedRefs, useControllableState } from "radix-ui/internal";
import * as React from "react";
import { createContext } from "../helpers/create-context.js";
import { getTabbableNodes } from "../helpers/get-tabbable-nodes.js";
import * as RovingFocusGroup from "../helpers/roving-focus.js";
import { ComponentPropsWithout, extractProps, RemovedProps } from "../helpers/themes.js";
import { useIsomorphicLayoutEffect } from "../helpers/use-isomorphic-layout-effect.js";
import { GetPropDefTypes, marginPropDefs, MarginProps } from "../props.js";
import { Portal } from "./portal.js";
import * as ScrollArea from "./scroll-area.js";
import { Slot } from "./slot.js";
import { tableCellPropDefs, tableContentPropDefs, tableRowPropDefs } from "./table.props.js";
import { Text } from "./text.js";
import { VisuallyHidden } from "./visually-hidden.js";

interface TableRootProps extends React.ComponentPropsWithoutRef<"div">, MarginProps {}

const TableRoot = React.forwardRef<HTMLDivElement, TableRootProps>((props, forwardedRef) => {
  const { className, ...rootProps } = extractProps(props, marginPropDefs);
  return <div ref={forwardedRef} className={classNames(className, "TableRoot")} {...rootProps} />;
});

TableRoot.displayName = "TableRoot";

interface TableContentContextValue {
  value?: string;
  onValueChange: (value: string) => void;
  hasFocusWithin: boolean;
}

const [TableContentProvider, useTableContentContext] =
  createContext<TableContentContextValue>("TableContent");

interface TableContentOwnProps extends GetPropDefTypes<typeof tableContentPropDefs> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface TableContentProps
  extends TableContentOwnProps, ComponentPropsWithout<"div", RemovedProps>, MarginProps {}

const defaultAriaDescription = "Press Up Arrow or Down Arrow to navigate the rows.";

const TableContent = React.forwardRef<HTMLTableElement, TableContentProps>(
  ({ children, defaultValue, onValueChange, value: valueProp, ...props }, forwardedRef) => {
    const { className, ...contentProps } = extractProps(props, marginPropDefs);
    const { className: tableClassName } = extractProps(props, tableContentPropDefs);

    const [value, setValue] = useControllableState({
      prop: valueProp,
      onChange: onValueChange,
      defaultProp: defaultValue ?? "",
    });

    const [hasFocusWithin, setHasFocusWithin] = React.useState(false);
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    const viewportRef = React.useRef<HTMLDivElement>(null);
    const tableRef = React.useRef<HTMLTableElement>(null);

    useIsomorphicLayoutEffect(() => {
      const content = contentRef.current;
      const viewport = viewportRef.current;
      const firstCell = viewport?.querySelector("th");
      const header = viewport?.querySelector("thead");

      if (content && viewport && firstCell && header) {
        const contentResizeObserver = new ResizeObserver(() => {
          // Observe content size changes to turn on/off sticky first column
          if (viewport.scrollWidth > viewport.clientWidth) {
            content.setAttribute("data-has-horizontal-scroll", "true");
          } else {
            content.removeAttribute("data-has-horizontal-scroll");
          }

          // Observe content size changes to turn on/off sticky header
          if (viewport.scrollHeight > viewport.clientHeight) {
            content.setAttribute("data-has-vertical-scroll", "true");
          } else {
            content.removeAttribute("data-has-vertical-scroll");
          }
        });

        contentResizeObserver.observe(content);

        // Observe first cell size to position the scrollbar to the right of it
        const firstCellResizeObserver = new ResizeObserver(([entry]) => {
          const width = entry?.borderBoxSize?.[0]?.inlineSize;
          if (width !== undefined) {
            content.style.setProperty("--table-scrollbar-x-offset", `${width}px`);
          }
        });

        firstCellResizeObserver.observe(firstCell, { box: "border-box" });

        // Observe header to position the scrollbar to the bottom of it
        const headerResizeObserver = new ResizeObserver(([entry]) => {
          const height = entry?.borderBoxSize?.[0]?.blockSize;
          if (height !== undefined) {
            content.style.setProperty("--table-scrollbar-y-offset", `${height}px`);
          }
        });

        headerResizeObserver.observe(header, { box: "border-box" });

        return () => {
          contentResizeObserver.disconnect();
          firstCellResizeObserver.disconnect();
          headerResizeObserver.disconnect();
        };
      }

      return;
    }, []);

    const ariaDescribedById = React.useId();

    const [ariaDescription, setAriaDescription] = React.useState(defaultAriaDescription);

    return (
      <TableContentProvider
        hasFocusWithin={hasFocusWithin}
        value={value}
        onValueChange={(value) => setValue(value)}
      >
        <Text
          ref={contentRef}
          as="div"
          className={classNames(className, "TableContent")}
          size="2"
          {...contentProps}
        >
          <RovingFocusGroup.Root asChild dir="ltr" loop={false} orientation="vertical">
            <ScrollArea.Root>
              <ScrollArea.Viewport ref={viewportRef}>
                <table
                  ref={composeRefs(tableRef, forwardedRef)}
                  aria-describedby={ariaDescribedById}
                  className={classNames("TableContentTable", tableClassName)}
                  // Make it possible for the screen reader to focus the table with the virtual cursor
                  tabIndex={-1}
                  onBlur={(event) => {
                    if (!tableRef.current?.contains(event.relatedTarget)) {
                      // Update the value right after the table loses focus.
                      // Prevents issues when table is in a focus lock, e.g. in a dialog
                      setTimeout(() => setHasFocusWithin(false));
                    }
                  }}
                  onFocus={(event) => {
                    setHasFocusWithin(true);

                    if (event.target instanceof HTMLTableElement) {
                      setAriaDescription(defaultAriaDescription);
                    }

                    if (event.target instanceof HTMLTableRowElement) {
                      const table = event.target?.closest("table");
                      const rows = table?.querySelectorAll("tr") ?? [];
                      const rowsCount = rows.length ?? 0;
                      const currentRow = Array.from(rows).indexOf(event.target) + 1;
                      const cells = Array.from(event.target.querySelectorAll("th, td"));
                      const cellText = cells.map((cell) => cell.textContent).join(", ");

                      let descriptor = "";

                      if (event.target.getAttribute("data-clickable")) {
                        descriptor = "clickable,";
                      }

                      if (event.target.getAttribute("data-selected")) {
                        descriptor = "selected,";
                      }

                      const description = `
                        Row ${currentRow} of ${rowsCount}, ${descriptor} ${cellText}. ${defaultAriaDescription}
                      `;

                      setAriaDescription(description);
                    }
                  }}
                >
                  {children}
                </table>
              </ScrollArea.Viewport>

              <ScrollArea.Scrollbar
                className="TableContentScrollbarVertical"
                orientation="vertical"
              />

              <ScrollArea.Scrollbar
                className="TableContentScrollbarHorizontal"
                orientation="horizontal"
              />

              {hasFocusWithin && (
                <Portal>
                  <VisuallyHidden aria-live="assertive" id={ariaDescribedById} tabIndex={-1}>
                    {ariaDescription}
                  </VisuallyHidden>
                </Portal>
              )}
            </ScrollArea.Root>
          </RovingFocusGroup.Root>
        </Text>
      </TableContentProvider>
    );
  },
);

TableContent.displayName = "TableContent";

type TableHeaderProps = React.ComponentPropsWithoutRef<"thead">;

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, forwardedRef) => (
    <thead ref={forwardedRef} className={classNames(className, "TableHeader")} {...props} />
  ),
);

TableHeader.displayName = "TableHeader";

type TableBodyProps = React.ComponentPropsWithoutRef<"tbody">;

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, forwardedRef) => (
    <tbody ref={forwardedRef} className={classNames(className, "TableBody")} {...props} />
  ),
);

TableBody.displayName = "TableBody";

interface TableRowContextValue {
  actionNode: HTMLElement | null;
  linkNode: HTMLAnchorElement | null;
  setActionNode: (element: HTMLElement | null) => void;
  setLinkNode: (element: HTMLAnchorElement | null) => void;
}

const [TableRowProvider, useTableRowContext] = createContext<TableRowContextValue>("TableRow");

type TableRowOwnProps = GetPropDefTypes<typeof tableRowPropDefs>;

interface TableRowProps extends TableRowOwnProps, React.ComponentPropsWithoutRef<"tr"> {
  value?: string;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  (
    { children, onAuxClick, onBlur, onClick, onFocus, onKeyDown, onMouseDown, value, ...props },
    forwardedRef,
  ) => {
    const { className, ...rowProps } = extractProps(props, tableRowPropDefs);
    const rowRef = React.useRef<HTMLTableRowElement>(null);
    const composedRef = useComposedRefs(rowRef, forwardedRef);
    const [pressed, setPressed] = React.useState(false);

    const tableContext = useTableContentContext("TableContent");

    const [linkNode, setLinkNode] = React.useState<HTMLAnchorElement | null>(null);
    const [actionNode, setActionNode] = React.useState<HTMLElement | null>(null);

    const isTabLike = value !== undefined;
    const isSelected = isTabLike && value === tableContext.value;
    const clickable = Boolean(onClick || isTabLike || linkNode || actionNode);

    const tabbableNodes = React.useRef<
      {
        element: HTMLElement;
        originalTabIndex: string | null;
      }[]
    >([]);

    // Keep track of the length as a state to update `focusable` when that changes
    const [tabbableNodesLength, setTabbableNodesLength] = React.useState(0);

    const focusable = Boolean(tableContext.hasFocusWithin || clickable || tabbableNodesLength);

    const removeChildrenTabIndices = React.useCallback(() => {
      if (rowRef.current) {
        const nodes = getTabbableNodes(rowRef.current);

        tabbableNodes.current = nodes.map((element) => ({
          element,
          originalTabIndex: element.getAttribute("tabindex"),
        }));

        setTabbableNodesLength(nodes.length);
        nodes.forEach((child) => child.setAttribute("tabindex", "-1"));
      }
    }, []);

    const restoreChildrenTabIndices = React.useCallback(() => {
      tabbableNodes.current.forEach(({ element, originalTabIndex }) => {
        if (originalTabIndex === null) {
          element.removeAttribute("tabindex");
        } else {
          element.setAttribute("tabindex", originalTabIndex);
        }
      });
    }, []);

    React.useEffect(() => {
      removeChildrenTabIndices();
      // Make sure we start from a clean state
      return restoreChildrenTabIndices;
    }, [removeChildrenTabIndices, restoreChildrenTabIndices]);

    // Render a placeholder row when there are no children so that you can use it for presentational reasons
    if (!children) {
      return (
        <tr ref={forwardedRef} aria-hidden className={classNames(className, "TableRow")}>
          <TableCell aria-hidden colSpan={1000} />
        </tr>
      );
    }

    return (
      <TableRowProvider
        actionNode={actionNode}
        linkNode={linkNode}
        setActionNode={setActionNode}
        setLinkNode={setLinkNode}
      >
        <RovingFocusGroup.Item asChild active={isSelected} focusable={focusable}>
          <tr
            ref={composedRef}
            className={classNames(className, "TableRow")}
            data-clickable={clickable || undefined}
            data-pressed={(clickable && pressed) || undefined}
            data-selected={isSelected || undefined}
            onAuxClick={(event) => {
              // We need both onClick and onAuxClick for browser compatibility to identify a middle click.
              // Chrome doesn’t report `event.button` correctly in `onClick`, but does support `onAuxClick`,
              // while Safari reports `event.button` correctly, but doesn’t support `onAuxClick`.
              passLinkClick(linkNode, event);
              onAuxClick?.(event);
            }}
            onBlur={(event) => {
              onBlur?.(event);

              if (!event.currentTarget.contains(document.activeElement)) {
                removeChildrenTabIndices();
              }
            }}
            onClick={(event) => {
              if (actionNode && isRowTarget(event)) {
                actionNode.click();
              }

              passLinkClick(linkNode, event);
              onClick?.(event);
            }}
            onContextMenu={() => {
              // Remove pressed state if mousedown actually invoked a context menu
              // (e.g. via Control-click, which we need to allow for opening new tabs in Windows)
              setPressed(false);
            }}
            onFocus={(event) => {
              restoreChildrenTabIndices();
              onFocus?.(event);
            }}
            onKeyDown={(event) => {
              const isClickLike = event.key === " " || event.key === "Enter";

              if (isClickLike && isRowTarget(event)) {
                event.preventDefault();
                actionNode?.click();

                if (isTabLike) {
                  tableContext.onValueChange(value);
                }

                if (linkNode) {
                  setPressed(true);

                  addEventListener("keyup", () => setPressed(false), {
                    once: true,
                  });
                }
              }

              passLinkClick(linkNode, event);
              onKeyDown?.(event);
            }}
            onMouseDown={(event) => {
              const isMouseRightClick = event.button === 2;

              if (!isMouseRightClick && isRowTarget(event)) {
                // Don't change tabs on context menu invoked via Control-click
                if (isTabLike && !event.ctrlKey) {
                  tableContext.onValueChange(value);
                }

                if (linkNode) {
                  // Toggle to pressed if we anticipate that navigation will happen on click
                  setPressed(true);

                  addEventListener("mouseup", () => setPressed(false), {
                    once: true,
                  });
                }
              }

              onMouseDown?.(event);
            }}
            {...rowProps}
          >
            {children}
          </tr>
        </RovingFocusGroup.Item>
      </TableRowProvider>
    );
  },
);

/** Whether the row is the target that the user intended to click, or a nested interactive element within the row */
const isRowTarget = (event: React.KeyboardEvent | React.MouseEvent) =>
  (event.target instanceof HTMLElement || event.target instanceof SVGElement) &&
  event.target.closest(maybeInteractive) === event.currentTarget;

// A selector for elements that COULD be interactive – it’s acceptable if they are not
const maybeInteractive = `
  [contenteditable],
  [tabindex],
  a,
  audio,
  button,
  details,
  input,
  label,
  object,
  select,
  textarea,
  video
`;

const passLinkClick = (
  linkNode: HTMLAnchorElement | null,
  event: React.KeyboardEvent | React.MouseEvent,
) => {
  let isClickLike = event.nativeEvent instanceof MouseEvent;

  if ("key" in event) {
    isClickLike = event.key === " " || event.key === "Enter";
  }

  if (!linkNode || !isRowTarget(event) || !isClickLike) {
    return;
  }

  const originalTarget = linkNode.target;
  const isMiddleClick = "button" in event && event.button === 1;

  if (isMiddleClick || event.ctrlKey || event.shiftKey || event.metaKey) {
    linkNode.target = "_blank";
  }

  linkNode.click();

  if (!originalTarget) {
    linkNode.removeAttribute("target");
  } else {
    linkNode.target = originalTarget;
  }
};

TableRow.displayName = "TableRow";

type TableCellOwnProps = GetPropDefTypes<typeof tableCellPropDefs>;

interface TableCellProps
  extends TableCellOwnProps, Omit<React.ComponentPropsWithoutRef<"td">, "align" | "width"> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>((props, forwardedRef) => {
  const { className, ...cellProps } = extractProps(props, tableCellPropDefs);
  return <td ref={forwardedRef} className={classNames(className, "TableCell")} {...cellProps} />;
});

TableCell.displayName = "TableCell";

const TableColumnHeader = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  (props, forwardedRef) => {
    const { className, ...cellProps } = extractProps(props, tableCellPropDefs);
    return (
      <th
        ref={forwardedRef}
        className={classNames(className, "TableColumnHeader", "TableCell")}
        scope="col"
        {...cellProps}
      />
    );
  },
);

TableColumnHeader.displayName = "TableColumnHeader";

const TableRowHeader = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  (props, forwardedRef) => {
    const { className, ...cellProps } = extractProps(props, tableCellPropDefs);
    return (
      <th
        ref={forwardedRef}
        className={classNames(className, "TableRowHeader", "TableCell")}
        scope="row"
        {...cellProps}
      />
    );
  },
);

TableRowHeader.displayName = "TableRowHeader";

const TableRowAction = React.forwardRef<HTMLElement, React.PropsWithChildren>(
  (props, forwardedRef) => {
    const tableRowContext = useTableRowContext("TableRow");
    return (
      <Slot
        ref={composeRefs(forwardedRef, tableRowContext.setActionNode)}
        tabIndex={-1}
        {...props}
      />
    );
  },
);

TableRowAction.displayName = "TableRowAction";

type TableRowLinkProps = React.ComponentPropsWithoutRef<"svg"> & {
  visuallyHidden?: boolean;
};

const TableRowLink = React.forwardRef<SVGSVGElement, TableRowLinkProps>(
  ({ children, className, visuallyHidden = false, ...props }, forwardedRef) => {
    const linkWrapperRef = React.useRef<HTMLDivElement>(null);
    const tableRowContext = useTableRowContext("TableRow");

    const { child, hasValidChildren } = (() => {
      try {
        return { child: React.Children.only(children), hasValidChildren: true };
      } catch {
        return { child: null, hasValidChildren: false };
      }
    })();

    React.useEffect(() => {
      if (!hasValidChildren) {
        // eslint-disable-next-line no-console
        console.warn("TableRowLink must have exactly one child");
      }
    }, [hasValidChildren]);

    React.useEffect(() => {
      if (linkWrapperRef.current) {
        // We have to querySelector the link rather than get it via the ref and set the
        // tabindex manually rather than use Slot because Next.js links don’t forward refs
        const linkNode = linkWrapperRef.current.querySelector("a");
        tableRowContext.setLinkNode(linkNode);
        linkNode?.setAttribute("tabindex", "-1");
      }
    });

    return (
      <>
        {!visuallyHidden && (
          <ChevronRightIcon
            ref={forwardedRef}
            aria-hidden
            className={classNames(className, "TableRowLink")}
            height="16"
            width="16"
            {...props}
          />
        )}
        <VisuallyHidden ref={linkWrapperRef}>{child}</VisuallyHidden>
      </>
    );
  },
);

TableRowLink.displayName = "TableRowLink";

type TableFooterProps = React.ComponentPropsWithoutRef<"div">;

const TableFooter = React.forwardRef<HTMLDivElement, TableFooterProps>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={classNames(className, "TableFooter")} {...props} />
  ),
);

TableFooter.displayName = "TableFooter";

type TableDetailProps = React.ComponentPropsWithoutRef<"div">;

const TableDetail = React.forwardRef<HTMLDivElement, TableDetailProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={classNames(className, "TableDetail")} {...props}>
      <div className="TableDetailInner">
        <ScrollArea.Root>
          <ScrollArea.Viewport className="TableDetailViewport" tabIndex={0}>
            <div className="TableDetailViewportInner">{children}</div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" />
          <ScrollArea.Scrollbar orientation="vertical" />
        </ScrollArea.Root>
      </div>
    </div>
  ),
);

TableDetail.displayName = "TableDetail";

export const Root = TableRoot;
export const Detail = TableDetail;
export const Content = TableContent;
export const Header = TableHeader;
export const Row = TableRow;
export const Body = TableBody;
export const ColumnHeader = TableColumnHeader;
export const RowHeader = TableRowHeader;
export const Cell = TableCell;
export const RowLink = TableRowLink;
export const RowAction = TableRowAction;
export const Footer = TableFooter;
