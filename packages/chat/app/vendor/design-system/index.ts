export { extractMarginProps } from "@radix-ui/themes/helpers";

// Components pending migration to Radix Themes
export * as Avatar from "./components/avatar.js";
export * from "./components/checkbox.js";
export * as DropdownMenu from "./components/dropdown-menu.js";
export * from "./components/icon-button.js";
export * as Radio from "./components/radio.js";
export * as ScrollArea from "./components/scroll-area.js";

// Components re-exported from Radix Themes, but pending an API clean-up
export * from "./components/button.js";
export * from "./components/text-area.js";
export * as TextField from "./components/text-field.js";

// Components re-exported from Radix Themes
export * from "./components/accessible-icon.js";
export * as AlertDialog from "./components/alert-dialog.js";
export * from "./components/badge.js";
export * from "./components/blockquote.js";
export * from "./components/box.js";
export { Callout } from "./components/callout.js";
export * from "./components/card.js";
export * as CardList from "./components/card-list.js";
export { CheckboxCards } from "./components/checkbox-cards.js";
export { CheckboxGroup } from "./components/checkbox-group.js";
export * from "./components/code.js";
export * from "./components/container.js";
export * as DataList from "./components/data-list.js";
export * as Dialog from "./components/dialog.js";
export * from "./components/em.js";
export * from "./components/flex.js";
export * from "./components/grid.js";
export * from "./components/heading.js";
export { HoverCard } from "./components/hover-card.js";
export * from "./components/info-popover.js";
export * from "./components/info-tooltip.js";
export * from "./components/inset.js";
export * from "./components/kbd.js";
export * from "./components/link.js";
export * as ListCell from "./components/list-cell.js";
export { Popover } from "./components/popover.js";
export * from "./components/portal.js";
export * from "./components/progress.js";
export * from "./components/quote.js";
export { RadioCards } from "./components/radio-cards.js";
export { RadioGroup } from "./components/radio-group.js";
export * from "./components/reset.js";
export * from "./components/section.js";
export { SegmentedControl } from "./components/segmented-control.js";
export * as Select from "./components/select.js";
export * from "./components/separator.js";
export * from "./components/skeleton.js";
export * from "./components/slider.js";
export * from "./components/slot.js";
export * from "./components/spinner.js";
export * from "./components/strong.js";
export * from "./components/switch.js";
export { TabNav } from "./components/tab-nav.js";
export * as Tabs from "./components/tabs.js";
export * from "./components/text.js";
export * from "./components/theme.js";
export * from "./components/tooltip.js";
export * from "./components/visually-hidden.js";

// Components that deserve to be added to Radix Themes
export * as Accordion from "./components/accordion.js";
export * as CodeBlock from "./components/code-block.js";
export * from "./components/color-field.js";
export * as Combobox from "./components/combobox.js";
export * as ComboboxPrimitive from "./components/combobox.primitive.js";
export * as DefinitionList from "./components/definition-list.js";
export * as EmptyState from "./components/empty-state.js";
export * from "./components/image.js";
export * as ImageField from "./components/image-field.js";
export * from "./components/label.js";
export * from "./components/marker.js";
export * from "./components/permanent-link.js";
export * from "./components/status.js";

// Own components
export * from "./components/chip.js";
export * from "./components/date-picker.js";
export * from "./components/feature-icon.js";
export * from "./components/flag.js";
export * from "./components/icon-panel.js";
export * from "./components/json-path-selector.js";
export * from "./components/logo-icon.js";
export * from "./components/mdx-components.js";
export * as PageNav from "./components/page-nav.js";
export * from "./components/provider-icon.js";
export * as QuickNav from "./components/quick-nav.js";
export * as ResourceHeader from "./components/resource-header.js";
export * as Screenshot from "./components/screenshot.js";
export * as Table from "./components/table.js";
export * from "./components/zoomable.js";

// Icon registry (source of truth for ProviderIcon)
export * from "./icons.js";

// JsonPathSelector types
export type {
  JsonObject,
  JsonPrimitive,
} from "./components/json-path-selector/schema-tree.utils.js";

// Recipes
export * as CodeEditor from "./recipes/CodeEditor/index.js";
export * from "./recipes/copy-button.js";
export * from "./recipes/copy-chip.js";
export * from "./recipes/search-input.js";
export * from "./recipes/theme-toggle.js";

// Helpers
export { childrenText } from "./helpers/children-text.js";
export { createContext } from "./helpers/create-context.js";
export { isReactElement } from "./helpers/is-react-element.js";
export { isReactFragment } from "./helpers/is-react-fragment.js";
export { useEffectEvent } from "./helpers/use-effect-event.js";
export { useIsomorphicLayoutEffect } from "./helpers/use-isomorphic-layout-effect.js";
export { useObjectUrl } from "./helpers/use-object-url.js";
export { matchSorter } from "match-sorter";
