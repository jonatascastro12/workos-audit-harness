"use client";

import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  TriangleDownIcon,
  TriangleRightIcon,
} from "@radix-ui/react-icons";
import classNames from "classnames";
import { composeEventHandlers, useComposedRefs } from "radix-ui/internal";
import * as React from "react";
import { flushSync } from "react-dom";
import { Box } from "./box.js";
import * as Combobox from "./combobox.js";
import { Flex } from "./flex.js";
import { IconButton } from "./icon-button.js";
import { keysToPath, pathToKeys } from "./json-path-selector/internal-path.utils.js";
import {
  type JsonObject,
  type SchemaNode,
  buildSchemaTree,
  flattenSchemaTree,
  getAncestors,
  getDescendants,
  getParentNode,
  searchSchemaTree,
} from "./json-path-selector/schema-tree.utils.js";
import { Text } from "./text.js";
import * as TextField from "./text-field.js";
import { Tooltip } from "./tooltip.js";
import { VisuallyHidden } from "./visually-hidden.js";

type JsonPrimitive = string | number | boolean | null;

interface JsonPathSelectorProps {
  data: JsonObject;
  placeholder?: string;
  label?: string;
  onSelectionChange?: (selectedKeys: string[] | null) => void;
  selectedValue?: string[] | null;
  defaultSelectedValue?: string[] | null;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  emptyMessage?: string;
  notFoundMessage?: string;
  popoverWidth?: string;
  footer?: (context: {
    searchValue: string;
    selectedValueFooter: React.ReactNode | null;
  }) => React.ReactNode;
}

const JsonPathSelector = React.forwardRef<HTMLDivElement, JsonPathSelectorProps>(
  function JsonPathSelector(
    {
      data,
      placeholder = "Select an attribute",
      label = "Attributes",
      onSelectionChange,
      defaultSelectedValue = null,
      selectedValue: externalSelectedValue,
      disabled = false,
      align = "start",
      popoverWidth = "min(400px, 100svw)",
      emptyMessage = "No data to display",
      notFoundMessage = "No attributes found",
      footer,
    },
    ref,
  ) {
    const [searchValue, setSearchValue] = React.useState("");
    const [internalSelectedValue, setInternalSelectedValue] = React.useState<string[] | null>(
      defaultSelectedValue,
    );
    const [comboboxOpen, setComboboxOpen] = React.useState(false);
    const scrollAreaViewportRef = React.useRef<HTMLDivElement>(null);
    const selectionMadeRef = React.useRef(false);

    // Use external selected value if provided, otherwise use internal state
    const selectedValue =
      externalSelectedValue !== undefined ? externalSelectedValue : internalSelectedValue;

    // Convert selectedValue (key array) to internal path for Combobox
    const selectedPath = selectedValue ? keysToPath(selectedValue) : null;

    const [expandedKeysState, setExpandedKeysState] = React.useState(new Set<string>());

    // Build schema tree from data and flatten for searching with O(1) lookups
    const schemaTree = React.useMemo<{
      flattened: SchemaNode[];
      nested: SchemaNode[];
      nodeMap: Map<string, SchemaNode>;
    }>(() => {
      const { nodes, nodeMap } = buildSchemaTree(data);
      const flattened = flattenSchemaTree(nodes);

      return { flattened, nested: nodes, nodeMap };
    }, [data]);

    const matches = React.useMemo(
      () => searchSchemaTree(searchValue, schemaTree.flattened, schemaTree.nodeMap),
      [schemaTree.flattened, schemaTree.nodeMap, searchValue],
    );

    // expandedKeys is a derived state that is computed from the expandedKeysState
    // and matches. If there is a search value, and an item or any of its
    // descendants is in matches, the item should be expanded. If there is no
    // search value, just use the expandedKeysState.
    const expandedKeys = React.useMemo(() => {
      if (searchValue) {
        return new Set(matches.map((item) => item.path));
      }

      return expandedKeysState;
    }, [expandedKeysState, matches, searchValue]);

    // Handle expanded state when combobox opens/closes
    React.useEffect(() => {
      if (comboboxOpen) {
        // When opening, expand ancestors of selected path
        if (selectedPath) {
          const selectedNode = schemaTree.nodeMap.get(selectedPath);
          if (selectedNode) {
            const ancestors = getAncestors(selectedNode, schemaTree.nodeMap);
            const ancestorPaths = ancestors.map((ancestor) => ancestor.path);
            setExpandedKeysState(new Set(ancestorPaths));
          }
        }

        // Reset selection flag when opening
        selectionMadeRef.current = false;
      } else {
        // When closing, reset expanded keys
        setExpandedKeysState((set) => (set.size ? new Set<string>() : set));
      }
    }, [comboboxOpen, selectedPath, schemaTree.nodeMap]);

    React.useEffect(() => {
      if (comboboxOpen && selectedPath) {
        requestAnimationFrame(() => {
          // scroll to the selected path
          scrollAreaViewportRef.current?.querySelector("[data-selected]")?.scrollIntoView({
            block: "center",
          });
        });
      }
    }, [comboboxOpen, selectedPath]);

    // Handle focus return to trigger when selection is made
    const prevOpenRef = React.useRef(comboboxOpen);
    React.useEffect(() => {
      const wasOpen = prevOpenRef.current;
      prevOpenRef.current = comboboxOpen;

      // Only focus trigger if we were open and are now closed AND a selection was made
      if (wasOpen && !comboboxOpen && selectionMadeRef.current) {
        triggerRef.current?.focus();
      }
    }, [comboboxOpen]);

    const handleSelectionChange = React.useCallback(
      (path: string | null) => {
        // Convert internal path to key array
        const keys = path ? pathToKeys(path) : null;

        // Mark that a selection was made
        selectionMadeRef.current = true;

        if (externalSelectedValue !== undefined) {
          // Controlled component - call external handler
          onSelectionChange?.(keys);
        } else {
          // Uncontrolled component - update internal state
          setInternalSelectedValue(keys);
          onSelectionChange?.(keys);
        }
      },
      [externalSelectedValue, onSelectionChange],
    );

    const triggerRef = React.useRef<HTMLDivElement>(null);
    const triggerId = `path-selector-trigger${React.useId()}`;
    const composedRefs = useComposedRefs(ref, triggerRef);

    return (
      <Combobox.Root
        disabled={disabled}
        open={comboboxOpen}
        selectedValue={selectedPath}
        onOpenChange={setComboboxOpen}
        onSelectedValueChange={(value) => {
          // Only handle selection for items without children - O(1) lookup
          if (!value) {
            handleSelectionChange(null);
            return;
          }

          const item = schemaTree.nodeMap.get(value);
          if (!item?.children) {
            handleSelectionChange(value);
          } else {
            // For items with children, don't select them
            handleSelectionChange(null);
          }
        }}
        onValueChange={(value) => {
          React.startTransition(() => {
            setSearchValue(value);
          });
        }}
      >
        <Combobox.Label asChild>
          <VisuallyHidden>{label}</VisuallyHidden>
        </Combobox.Label>
        <Combobox.Anchor>
          <Combobox.Trigger
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ref={composedRefs as React.Ref<HTMLButtonElement>}
            returnFocusOnClose={false}
          >
            <div
              aria-label="Select an attribute"
              className="JsonPathSelectorTrigger"
              data-disabled={disabled ? "" : undefined}
              id={triggerId}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(event) => {
                if (event.key === "Backspace") {
                  // Backspace provides a keyboard shortcut to clear the selection
                  // when the trigger is focused, as an alternative to tabbing to
                  // the clear button.
                  event.preventDefault();
                  handleSelectionChange(null);
                }
                // Let Combobox.Trigger handle Enter, Space, ArrowUp, ArrowDown
                // by allowing event to propagate
              }}
            >
              <TextField.Root
                aria-hidden
                suppressPasswordManagers
                autoComplete="off"
                className="JsonPathSelectorTriggerTextField"
                disabled={disabled}
                placeholder={placeholder}
                role="presentation"
                size="2"
                tabIndex={-1}
                type="text"
                value={selectedValue ? renderInputValue(selectedValue) : ""}
                variant="surface"
                onKeyDown={(event) => event.preventDefault()}
                onFocus={(event) => {
                  // In the event that the input is focused programmatically,
                  // redirect focus to the trigger
                  event.preventDefault();
                  triggerRef.current?.focus();
                }}
              >
                <TextField.Slot>
                  <BracesIcon />
                </TextField.Slot>
                <TextField.Slot>
                  <Flex align="center" height="16px" justify="center" width="16px">
                    {selectedValue && !disabled ? (
                      <ComboboxClear
                        className="JsonPathSelectorClearButton"
                        disabled={disabled}
                        triggerId={triggerId}
                        onClear={() => {
                          flushSync(() => {
                            handleSelectionChange(null);
                          });
                          triggerRef.current?.focus();
                        }}
                      />
                    ) : (
                      <ChevronDownIcon />
                    )}
                  </Flex>
                </TextField.Slot>
              </TextField.Root>
            </div>
          </Combobox.Trigger>
        </Combobox.Anchor>
        <Combobox.Popover
          align={align}
          className="JsonPathSelectorComboboxPopover"
          style={{ borderRadius: "var(--radius-3)" }}
          width={popoverWidth}
        >
          <Combobox.Content>
            {schemaTree.flattened.length === 0 ? (
              <Flex align="center" gap="2" px="2" py="2">
                <Text color="gray" size="2">
                  {emptyMessage}
                </Text>
              </Flex>
            ) : (
              <>
                <Combobox.Header>
                  <Combobox.Input placeholder="Search">
                    <TextField.Slot>
                      <MagnifyingGlassIcon />
                    </TextField.Slot>
                  </Combobox.Input>
                </Combobox.Header>
                <Combobox.ScrollArea
                  ref={scrollAreaViewportRef}
                  className="JsonPathSelectorComboboxScrollArea"
                  maxItems={8}
                >
                  {(() => {
                    if (!searchValue || matches.length > 0) {
                      const items = matches.length > 0 ? matches : schemaTree.flattened;

                      return items.map((item) => {
                        const ancestors = getAncestors(item, schemaTree.nodeMap).map((n) => n.path);
                        const descendants = getDescendants(item, schemaTree.nodeMap).map(
                          (n) => n.path,
                        );

                        const hidden = (() => {
                          // if there's a search value, show all items
                          if (searchValue) {
                            return false;
                          }

                          // if any ancestor is collapsed, the item should be hidden
                          if (ancestors.some((ancestor) => !expandedKeys.has(ancestor))) {
                            return true;
                          }

                          // if immediate ancestor is expanded, the item should be shown
                          const parent = getParentNode(item, schemaTree.nodeMap);
                          if (parent && expandedKeys.has(parent.path)) {
                            return false;
                          }

                          // if any child is expanded, the item should be shown
                          if (descendants.some((descendant) => expandedKeys.has(descendant))) {
                            return false;
                          }

                          // Only hide items that have a parent (nested items)
                          const shouldHide = !!item.parent;
                          return shouldHide;
                        })();

                        if (hidden) {
                          return null;
                        }

                        const nestingLevel = getNestingLevel(item);
                        const childCount = item.children?.length ?? 0;
                        const isExpandable = !!item.children;

                        return (
                          <JsonPathSelectorItem
                            key={item.path}
                            childCount={childCount}
                            expandable={isExpandable}
                            expanded={expandedKeys.has(item.path)}
                            label={item.key}
                            nestingLevel={nestingLevel}
                            path={item.path}
                            type={item.type}
                            value={item.value}
                            onToggleExpanded={(path) => {
                              setExpandedKeysState((set) => {
                                const updatedSet = new Set(set);
                                if (set.has(path)) {
                                  updatedSet.delete(path);
                                } else {
                                  updatedSet.add(path);
                                }

                                return updatedSet.size === set.size ? set : updatedSet;
                              });
                            }}
                          />
                        );
                      });
                    }

                    return (
                      <Flex align="center" gap="2" justify="between" px="2" py="1">
                        <Text size="2">{notFoundMessage}</Text>
                      </Flex>
                    );
                  })()}
                </Combobox.ScrollArea>
                {(() => {
                  const selectedValueFooter = selectedValue ? (
                    <FormattedAttributeMappingValue value={selectedValue} />
                  ) : null;

                  const footerContent = footer
                    ? footer({ searchValue, selectedValueFooter })
                    : selectedValueFooter;

                  if (!footerContent) {
                    return null;
                  }

                  return <Combobox.Footer>{footerContent}</Combobox.Footer>;
                })()}
              </>
            )}
          </Combobox.Content>
        </Combobox.Popover>
      </Combobox.Root>
    );
  },
);

interface JsonPathSelectorItemProps {
  expandable: boolean;
  expanded: boolean;
  disabled?: boolean;
  onToggleExpanded?: (path: string) => void;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  nestingLevel: number;
  childCount: number;
  type: "object" | "array" | "primitive";
  value: JsonPrimitive | undefined;
  path: string;
  label: string;
}

const JsonPathSelectorItem = React.forwardRef<HTMLDivElement, JsonPathSelectorItemProps>(
  function JsonPathSelectorItem(
    {
      expandable,
      expanded,
      onToggleExpanded,
      disabled,
      className,
      style,
      onClick,
      onKeyDown,
      nestingLevel,
      childCount,
      type,
      value,
      path,
      label,
      ...comboboxItemProps
    },
    ref,
  ) {
    if (expandable && childCount === 0) {
      disabled = true;
    }

    if (!expandable) {
      expanded = false;
    }

    const handleClick = (event: React.MouseEvent | React.KeyboardEvent) => {
      if (expandable) {
        event.preventDefault();
        event.stopPropagation();
        onToggleExpanded?.(path);
      }
    };

    return (
      <Combobox.Item
        ref={ref}
        className={classNames("JsonPathSelectorComboboxItem", className)}
        data-nesting-level={nestingLevel}
        disabled={disabled}
        style={{ "--_nesting-level": nestingLevel, ...style }}
        value={path}
        onClick={composeEventHandlers(onClick, handleClick)}
        onKeyDown={composeEventHandlers(onKeyDown, (event) => {
          // Only expand on Enter, as spacebar is used for searching.
          if (event.key === "Enter") {
            handleClick(event);
          }
        })}
        {...comboboxItemProps}
      >
        <Flex asChild align="center" gap="6px" minWidth="0">
          <Text as="span" size="2">
            <Flex align="center" gap="1" minWidth="0">
              {expandable && (
                <Box className="JsonPathSelectorArrow" flexShrink="0">
                  {expanded ? <TriangleDownIcon /> : <TriangleRightIcon />}
                </Box>
              )}
              <Text truncate as="span" className="JsonPathSelectorComboboxItemKey">
                {label}
              </Text>
            </Flex>

            {!expanded && (
              <>
                <Box asChild flexShrink="0">
                  <Text aria-hidden as="span" className="JsonPathSelectorComboboxItemSeparator">
                    :
                  </Text>
                </Box>
                <Box asChild flexShrink="0">
                  <Text
                    as="span"
                    className="JsonPathSelectorComboboxItemValue"
                    color={(() => {
                      switch (type) {
                        case "array":
                          return "purple";
                        case "object":
                          return "blue";
                        case "primitive":
                        default:
                          return "blue";
                      }
                    })()}
                  >
                    {(() => {
                      if (expandable) {
                        if (type === "object") {
                          return "{…}";
                        }

                        if (type === "array") {
                          return "[…]";
                        }
                      }

                      return String(value);
                    })()}
                  </Text>
                </Box>
              </>
            )}
          </Text>
        </Flex>
      </Combobox.Item>
    );
  },
);

const BracesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="14"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="white" fillOpacity="0.01" height="16" width="14" />
    <path
      clipRule="evenodd"
      d="M4.66667 1.5C4.18044 1.5 3.71412 1.69315 3.3703 2.03697C3.02649 2.38079 2.83333 2.8471 2.83333 3.33333V6.66667C2.83333 6.88768 2.74554 7.09964 2.58926 7.25592C2.43298 7.4122 2.22101 7.5 2 7.5C1.72386 7.5 1.5 7.72386 1.5 8C1.5 8.27614 1.72386 8.5 2 8.5C2.22101 8.5 2.43298 8.5878 2.58926 8.74408C2.74554 8.90036 2.83333 9.11232 2.83333 9.33333V12.6667C2.83333 13.6761 3.65719 14.5 4.66667 14.5H5.33333C5.60948 14.5 5.83333 14.2761 5.83333 14C5.83333 13.7239 5.60948 13.5 5.33333 13.5H4.66667C4.20948 13.5 3.83333 13.1239 3.83333 12.6667V9.33333C3.83333 8.8471 3.64018 8.38079 3.29636 8.03697C3.28384 8.02445 3.27115 8.01212 3.25831 8C3.27115 7.98788 3.28384 7.97555 3.29636 7.96303C3.64018 7.61921 3.83333 7.1529 3.83333 6.66667V3.33333C3.83333 3.11232 3.92113 2.90036 4.07741 2.74408C4.23369 2.5878 4.44565 2.5 4.66667 2.5H5.33333C5.60948 2.5 5.83333 2.27614 5.83333 2C5.83333 1.72386 5.60948 1.5 5.33333 1.5H4.66667ZM10.6667 1.5C10.3905 1.5 10.1667 1.72386 10.1667 2C10.1667 2.27614 10.3905 2.5 10.6667 2.5H11.3333C11.5544 2.5 11.7663 2.5878 11.9226 2.74408C12.0789 2.90036 12.1667 3.11232 12.1667 3.33333V6.66667C12.1667 7.1529 12.3598 7.61921 12.7036 7.96303C12.7165 7.97593 12.7296 7.98863 12.7429 8.00111C12.3885 8.33578 12.1667 8.80957 12.1667 9.33333V12.6667C12.1667 12.8877 12.0789 13.0996 11.9226 13.2559C11.7663 13.4122 11.5544 13.5 11.3333 13.5H10.6667C10.3905 13.5 10.1667 13.7239 10.1667 14C10.1667 14.2761 10.3905 14.5 10.6667 14.5H11.3333C11.8196 14.5 12.2859 14.3068 12.6297 13.963C12.9735 13.6192 13.1667 13.1529 13.1667 12.6667V9.33333C13.1667 8.87614 13.5428 8.5 14 8.5C14.2761 8.5 14.5 8.27614 14.5 8C14.5 7.72386 14.2761 7.5 14 7.5C13.779 7.5 13.567 7.4122 13.4107 7.25592C13.2545 7.09964 13.1667 6.88768 13.1667 6.66667V3.33333C13.1667 2.8471 12.9735 2.38079 12.6297 2.03697C12.2859 1.69315 11.8196 1.5 11.3333 1.5H10.6667Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const renderInputValue = (keys: string[]): string => keys[keys.length - 1] ?? "";

function getNestingLevel(item: SchemaNode) {
  if (!item.parent) {
    return 0;
  }

  return pathToKeys(item.path).length - 1;
}

interface ComboboxClearProps extends Omit<
  React.ComponentPropsWithoutRef<typeof IconButton>,
  "children"
> {
  size?: "1" | "2" | "3";
  onClear: () => void;
  triggerId: string;
}

/**
 * TODO: The Combobox.Clear component in the DS to be used in the context of a
 * Text Field, but we show one instead next to the trigger which is a button.
 * This is a slight modification to accommodate for that, but we should build
 * this flexibility into the DS instead.
 */
const ComboboxClear = React.forwardRef<HTMLButtonElement, ComboboxClearProps>(
  function ComboboxClear(props, ref) {
    const { className, size = "1", disabled, onClear, triggerId, ...buttonProps } = props;
    const label = "Remove selection";
    return (
      <Tooltip content={label}>
        <IconButton
          ref={ref}
          aria-controls={triggerId}
          aria-label={label}
          disabled={disabled || undefined}
          {...buttonProps}
          className={classNames("ComboboxClear ComboboxIconButton", className)}
          fullyDisabled={disabled}
          size={size}
          type="button"
          onClick={(event) => {
            if (disabled) {
              return;
            }

            // since the clear button is nested inside the trigger, stop
            // propagation to prevent re-opening the combobox
            event.stopPropagation();
            onClear();
          }}
          onKeyDown={(event) => {
            if (disabled) {
              return;
            }

            // Stop propagation for Enter/Space to prevent the Combobox.Trigger
            // from treating these as OPEN_KEYS and reopening the combobox
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation();
            }
          }}
          onPointerDown={(event) => {
            if (disabled) {
              return;
            }

            // combobox will open on pointer down in some cases
            event.stopPropagation();
          }}
        >
          <TrashIcon aria-hidden className="ComboboxIcon ComboboxClearIcon" />
        </IconButton>
      </Tooltip>
    );
  },
);

interface FormattedAttributeMappingValueProps {
  value: string[] | null;
}

/**
 * Displays a selected nested attribute path in arrow notation format.
 * Example: parent > child > child > leaf
 */
const FormattedAttributeMappingValue: React.FC<FormattedAttributeMappingValueProps> = ({
  value,
}) => {
  if (!value || value.length === 0) {
    return (
      <Text color="gray" size="2">
        Not set
      </Text>
    );
  }

  return (
    <Box
      className="JsonPathSelectorFooterValueContainer"
      style={{
        lineHeight: "20px",
        fontSize: "12.8px",
        fontFamily: "var(--code-font-family)",
        color: "var(--gray-a11)",
      }}
    >
      {value.map((key, index) => (
        <React.Fragment key={`${key}-${index}`}>
          {index > 0 && (
            <Box
              asChild
              style={{
                color: "var(--gray-a10)",
                display: "inline-block",
                verticalAlign: "middle",
                margin: "0 var(--space-1)",
              }}
            >
              <TriangleRightIcon />
            </Box>
          )}
          <Box
            asChild
            className="JsonPathSelectorFooterValue"
            style={{
              display: "inline",
            }}
          >
            <span>{key}</span>
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
};

export type {
  FormattedAttributeMappingValueProps,
  JsonPathSelectorItemProps,
  JsonPathSelectorProps,
};
export {
  FormattedAttributeMappingValue,
  JsonPathSelectorItem as Item,
  JsonPathSelector,
  JsonPathSelector as Root,
};
