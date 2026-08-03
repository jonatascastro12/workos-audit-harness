import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";
import * as ScrollArea from "./scroll-area.js";

interface CodeBlockRootProps extends React.ComponentPropsWithRef<"div">, MarginProps {}

const CodeBlockRoot = React.forwardRef<HTMLDivElement, CodeBlockRootProps>(
  (props, forwardedRef) => {
    const { className, ...rootProps } = extractProps(props, marginPropDefs);
    return (
      <div ref={forwardedRef} className={classNames("CodeBlockRoot", className)} {...rootProps} />
    );
  },
);

CodeBlockRoot.displayName = "CodeBlockRoot";

const CodeBlockOutput = React.forwardRef<HTMLOutputElement, React.ComponentPropsWithRef<"output">>(
  ({ className, children, ...props }, forwardedRef) => (
    <output ref={forwardedRef} className={classNames("CodeBlockOutput", className)} {...props}>
      <ScrollArea.Root>
        <ScrollArea.Viewport>{children}</ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" />
        <ScrollArea.Scrollbar orientation="horizontal" />
      </ScrollArea.Root>
    </output>
  ),
);

CodeBlockOutput.displayName = "CodeBlockOutput";

const CodeBlockHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={classNames("CodeBlockHeader", className)} {...props} />
  ),
);

CodeBlockHeader.displayName = "CodeBlockHeader";

const CodeBlockFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={classNames("CodeBlockFooter", className)} {...props} />
  ),
);

CodeBlockFooter.displayName = "CodeBlockFooter";

interface CodeBlockContentOwnProps {
  wrap?: "pre" | "pre-wrap";
}

interface CodeBlockContentProps
  extends CodeBlockContentOwnProps, React.ComponentPropsWithRef<"pre"> {
  height?: string | number;
  maxHeight?: string | number;
}

const CodeBlockContent = React.forwardRef<HTMLPreElement, CodeBlockContentProps>(
  ({ className, children, wrap, height, maxHeight, ...props }, forwardedRef) => (
    <pre
      ref={forwardedRef}
      className={classNames("CodeBlockContent", className, {
        "ws-pre-wrap": wrap === "pre-wrap",
        "ws-pre": wrap === "pre",
      })}
      {...props}
    >
      <ScrollArea.Root>
        <ScrollArea.Viewport>
          <code
            className="CodeBlockCode"
            style={{
              "--code-block-height": height,
              "--code-block-max-height": maxHeight,
            }}
          >
            <div className="CodeBlockContentInner">{children}</div>
          </code>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" />
        <ScrollArea.Scrollbar orientation="horizontal" />
      </ScrollArea.Root>
    </pre>
  ),
);

CodeBlockContent.displayName = "CodeBlockContent";

interface CodeBlockLineGroupOwnProps {
  gutter?: "numbers" | "cli" | "none";
}

interface CodeBlockLineGroupProps
  extends Omit<React.ComponentPropsWithRef<"table">, "color">, CodeBlockLineGroupOwnProps {}

const CodeBlockLineGroup = React.forwardRef<HTMLTableElement, CodeBlockLineGroupProps>(
  ({ gutter = "numbers", children, className, ...props }, forwardedRef) => (
    <table
      ref={forwardedRef}
      role="presentation"
      className={classNames("CodeBlockLineGroup", className, {
        "gutter-numbers": gutter === "numbers",
        "gutter-cli": gutter === "cli",
      })}
      {...props}
    >
      <tbody>{children}</tbody>
    </table>
  ),
);

CodeBlockLineGroup.displayName = "CodeBlockLineGroup";

interface CodeBlockLineOwnProps {
  color?: "yellow" | "blue" | "green" | "red" | "focused";
}

interface CodeBlockLineProps
  extends Omit<React.ComponentPropsWithRef<"tr">, "color">, CodeBlockLineOwnProps {}

const CodeBlockLine = React.forwardRef<HTMLTableRowElement, CodeBlockLineProps>(
  ({ children = "\n", color, className, ...props }, forwardedRef) => (
    <tr
      ref={forwardedRef}
      className={classNames("CodeBlockLine", className, {
        yellow: color === "yellow",
        green: color === "green",
        red: color === "red",
        blue: color === "blue",
        focused: color === "focused",
      })}
      {...props}
    >
      <td className="CodeBlockLineGutter" />
      <td className="CodeBlockLineContent">{children}</td>
    </tr>
  ),
);

CodeBlockLine.displayName = "CodeBlockLine";

export const Root = CodeBlockRoot;
export const Header = CodeBlockHeader;
export const Footer = CodeBlockFooter;
export const Output = CodeBlockOutput;
export const Content = CodeBlockContent;
export const LineGroup = CodeBlockLineGroup;
export const Line = CodeBlockLine;
