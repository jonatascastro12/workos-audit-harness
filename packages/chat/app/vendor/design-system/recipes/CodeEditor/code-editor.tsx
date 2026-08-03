"use client";
import classNames from "classnames";
import * as React from "react";
import { Box } from "../../components/box.js";
import { Flex } from "../../components/flex.js";
import { CodeEditorRoot, useCodeEditorContext } from "./code-editor-context.js";
import { DiagnosticsToggle } from "./diagnostics.js";

export const Content = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof Box>) => {
  const { container, setContainer, view } = useCodeEditorContext();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Move along if we're not focused
      if (view?.contentDOM !== document.activeElement) {
        return;
      }

      // Have to check the entire container because autocomplete and similar
      // extensions are outside of the contentDOM.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      if (container?.contains(event.target as Node)) {
        return;
      }

      view?.contentDOM.blur();
    };

    window.addEventListener("pointerdown", handleClickOutside, {
      capture: true,
    });
    return () => {
      window.removeEventListener("pointerdown", handleClickOutside, {
        capture: true,
      });
    };
  }, [view, container]);

  return (
    <Box
      ref={setContainer}
      className={classNames("CodeEditor", className)}
      height="100%"
      minHeight="0"
      {...props}
    />
  );
};

export const Header = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof Flex>) => (
  <Flex
    className={classNames("CodeEditorHeader", className)}
    display="inline-flex"
    justify="between"
    px="3"
    py="2"
    width="100%"
    {...props}
  />
);
export const Footer = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof Flex>) => (
  <Flex
    className={classNames("CodeEditorFooter", className)}
    display="inline-flex"
    justify="between"
    px="3"
    py="2"
    width="100%"
    {...props}
  />
);

export const Frame = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof Flex>) => (
  <Flex
    className={classNames("CodeEditorFrame", className)}
    direction="column"
    height="100%"
    minHeight="0"
    {...props}
  />
);

export const Diagnostics = DiagnosticsToggle;
export const Root = CodeEditorRoot;
