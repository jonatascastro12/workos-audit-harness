"use client";
import { Diagnostic, forEachDiagnostic } from "@codemirror/lint";
import {
  BasicSetupOptions,
  EditorView,
  Extension,
  UseCodeMirror,
  useCodeMirror,
} from "@uiw/react-codemirror";
import * as React from "react";
import { workOSOne } from "../../helpers/code-editor-theme.js";

export interface CodeEditorContextType {
  diagnostics: Diagnostic[];
  container?: HTMLDivElement | null;
  setContainer?: (container: HTMLDivElement) => void;
  view?: EditorView;
}

export const CodeEditorContext = React.createContext<CodeEditorContextType>({
  diagnostics: [],
});

export const useCodeEditorContext = () => React.useContext(CodeEditorContext);

export interface CodeEditorRootProps extends Omit<UseCodeMirror, "basicSetup"> {
  children?: React.ReactNode;
  className?: string;
  basicSetup?: BasicSetupOptions;
  autoComplete?: Extension;
}

export const CodeEditorRoot = ({
  children,
  extensions,
  className,
  autoComplete,
  ...rest
}: CodeEditorRootProps) => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const [diagnostics, setDiagnostics] = React.useState<Diagnostic[]>([]);

  const updateListener = React.useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        const nextDiagnostics: Diagnostic[] = [];
        forEachDiagnostic(update.state, (diagnostic, from, to) => {
          nextDiagnostics.push({ ...diagnostic, from, to });
        });

        nextDiagnostics.sort((a, b) => a.from - b.from);

        let changed = nextDiagnostics.length !== diagnostics.length;
        for (let i = 0; i < Math.min(nextDiagnostics.length, diagnostics.length); i++) {
          if (
            nextDiagnostics[i]?.from !== diagnostics[i]?.from ||
            nextDiagnostics[i]?.to !== diagnostics[i]?.to ||
            nextDiagnostics[i]?.severity !== diagnostics[i]?.severity ||
            nextDiagnostics[i]?.message !== diagnostics[i]?.message
          ) {
            changed = true;
            break;
          }
        }

        if (changed) {
          setDiagnostics(nextDiagnostics);
        }
      }),
    [diagnostics],
  );

  const { view } = useCodeMirror({
    extensions: [
      extensions ?? [],
      EditorView.lineWrapping,
      workOSOne,
      updateListener,
      ...[autoComplete ? autoComplete : []],
    ],
    container,
    ...rest,
    basicSetup: {
      foldGutter: false,
      searchKeymap: false,
      autocompletion: !!autoComplete,
      ...(rest.basicSetup ?? {}),
    },
  });

  const contextValue = React.useMemo(
    () => ({ diagnostics, view, container, setContainer }),
    [diagnostics, view, container, setContainer],
  );

  return <CodeEditorContext.Provider value={contextValue}>{children}</CodeEditorContext.Provider>;
};
