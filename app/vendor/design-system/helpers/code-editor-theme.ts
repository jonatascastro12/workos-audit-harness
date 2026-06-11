import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView, Extension } from "@uiw/react-codemirror";

// The editor theme styles for WorkOS Editor.
// Docs: https://codemirror.net/examples/styling/#Themes
// Example: One Dark Theme https://github.com/codemirror/theme-one-dark/blob/main/src/one-dark.ts
export const workOSOneTheme = EditorView.theme(
  {
    "&": {
      color: "var(--gray-12)",
      fontSize: "var(--font-size-2)",
    },

    // Show a dimmed cursor when the editor is not focused
    "&:not(.cm-focused) .cm-cursor": {
      display: "block",
      borderLeftColor: "var(--gray-a8)",
    },

    "&.cm-focused": {
      // Focus is indicated by cursor and line number colors
      outline: "none",
    },

    ".cm-scroller": {
      backgroundColor: "var(--color-background)",
      fontFamily: "var(--code-font-family)",
    },

    ".cm-content": {
      caretColor: "var(--gray-12)",
      // Thoroughly protect against the cursor hiding behind the gutter in
      // retina displays (if it is ever opaque again)
      paddingLeft: "1px",
    },

    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--gray-12)" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: "var(--blue-4)" },

    // Panels handle things like find/replace. We currently don't have any, and they would need additional
    ".cm-panels": { backgroundColor: "var(--gray-1)", color: "var(--gray-12)" },
    ".cm-panels.cm-panels-top": { borderBottom: "2px solid var(--gray-3)" },
    ".cm-panels.cm-panels-bottom": { borderTop: "2px solid var(--gray-3)" },

    ".cm-activeLine": { backgroundColor: "transparent" },
    ".cm-selectionMatch": { backgroundColor: "transparent" },

    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "var(--gray-5)",
    },

    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "var(--gray-11)",
      border: "none",
    },

    ".cm-activeLineGutter": {
      color: "var(--gray-12)",
      backgroundColor: "transparent",
    },

    ".cm-foldPlaceholder": {
      backgroundColor: "var(--gray-1)",
      border: "none",
      color: "var(--gray-9)",
    },

    // Line number colors + active line number color
    ".cm-gutter.cm-lineNumbers .cm-gutterElement": {
      color: "var(--gray-a8)",
    },
    "&.cm-focused .cm-gutter.cm-lineNumbers .cm-gutterElement": {
      color: "var(--gray-a9)",
    },
    "&.cm-focused .cm-gutter.cm-lineNumbers .cm-gutterElement.cm-activeLineGutter": {
      color: "var(--gray-a12)",
    },

    ".cm-tooltip": {
      border: "none",
      borderRadius: "var(--radius-4)",
      backgroundColor: "var(--color-panel-solid)",
      color: "var(--gray-12)",
      overflow: "hidden",
      padding: "var(--space-2)",
      maxWidth: "30rem",
      fontFamily: "var(--code-font-family)",
      boxShadow: "var(--shadow-3)",
    },

    ".cm-tooltip.cm-tooltip-below": {
      transform: "translateY( var(--space-1))",
    },

    ".cm-tooltip.cm-tooltip-above": {
      transform: "translateY(calc(-1 * var(--space-1)))",
    },
    ".cm-tooltip.cm-tooltip-left": {
      transform: "translateX(calc(-1 * var(--space-1)))",
    },
    ".cm-tooltip.cm-tooltip-right": {
      transform: "translateX(var(--space-1))",
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: "var(--gray-1)",
      borderBottomColor: "var(--gray-1)",
    },

    ".cm-completionMatchedText": {
      textDecoration: "none",
      fontWeight: "bold",
    },

    ".cm-diagnostic": {
      border: "none",
    },
    ".cm-lint-marker": {
      padding: "3px",
      content: '""',
      boxSizing: "border-box",
      width: "14px",
      height: "14px",
    },
    ".cm-lint-marker:before": {
      content: '""',
      borderRadius: "50%",
      display: "block",
      height: "100%",
      width: "100%",
    },

    ".cm-diagnostic:before": {
      fontWeight: "bold",
    },
    ".cm-diagnostic-warning:before": {
      content: '"Warning: "',
      fontWeight: "bold",
    },
    ".cm-diagnostic-error:before": {
      content: '"Error: "',
      fontWeight: "bold",
    },
    ".cm-lint-marker-warning:before": {
      backgroundColor: "var(--yellow-8)",
    },
    ".cm-lint-marker-error:before": {
      backgroundColor: "var(--red-10)",
    },

    // Autocomplete
    ".cm-tooltip-autocomplete": {
      padding: "0",
    },
    '.cm-tooltip-autocomplete ul[role="listbox"]': {
      padding: "var(--space-1)",
      fontSize: "var(--font-size-1)",
      maxHeight: "15rem",
    },
    ".cm-tooltip-autocomplete > ul > li": {
      padding: "var(--space-2) var(--space-3) !important",
      display: "grid",
      gap: "var(--space-2)",
      gridTemplateColumns: "minmax(0, 1fr) min-content",
      gridTemplateAreas: '"label detail"',
      alignItems: "center",
      borderRadius: "var(--radius-2)",
      color: "var(--gray-11)",
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected="true"]': {
      backgroundColor: "var(--gray-a3)",
      color: "var(--gray-12)",
    },
    '.cm-tooltip-autocomplete > ul > li[role="option"]:not([aria-selected="true"]):hover': {
      backgroundColor: "var(--gray-a3)",
      color: "var(--gray-12)",
    },
    ".cm-completionIcon": {
      // TODO: add the icon somehow?
      gridArea: "icon",
      display: "none",
    },
    ".cm-completionLabel": {
      gridArea: "label",
      color: "inherit",
    },
    ".cm-completionDetail": {
      color: "var(--gray-9)",
      gridArea: "detail",
    },
  },
  { dark: true },
);

const workOSOneHighlights = HighlightStyle.define([
  { tag: [t.comment, t.processingInstruction], color: "var(--gray-11)" },

  { tag: t.namespace, color: "var(--purple-11)" },

  {
    tag: [t.propertyName, t.tagName, t.bool, t.number, t.null, t.deleted],
    color: "var(--blue-11)",
  },

  {
    tag: [t.className, t.attributeName, t.string, t.character, t.inserted],
    color: "var(--blue-12)",
  },

  { tag: [t.keyword, t.typeName], color: "var(--green-11)" },

  { tag: [t.operator, t.url], color: "var(--red-11)" },

  {
    tag: [t.function(t.variableName), t.className],
    color: "var(--purple-11)",
  },

  {
    tag: [t.special(t.brace), t.punctuation, t.regexp, t.variableName],
    color: "inherit",
  },

  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "var(--blue-12)", textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold" },
  { tag: [t.atom, t.special(t.variableName)], color: "inherit" },
  { tag: t.invalid, color: "inherit" },
  {
    tag: [t.operatorKeyword, t.escape, t.special(t.string)],
    color: "var(--blue-12)",
  },
  {
    tag: [t.meta, t.modifier, t.self, t.annotation],
    color: "var(--gray-11)",
  },
]);

// Extension to enable the One Dark theme (both the editor theme and
// the highlight style).
export const workOSOne: Extension = [workOSOneTheme, syntaxHighlighting(workOSOneHighlights)];
