import { nextDiagnostic } from "@codemirror/lint";
import { CheckCircledIcon, CrossCircledIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { EditorView } from "@uiw/react-codemirror";
import { Button } from "../../components/button.js";
import { Tooltip } from "../../components/tooltip.js";
import { useCodeEditorContext } from "./code-editor-context.js";

const SCROLL_BUFFER = 200;

export const DiagnosticsToggle = () => {
  const { view, diagnostics } = useCodeEditorContext();

  const handleGoToNextDiagnostic = () => {
    if (!view) {
      return;
    }

    nextDiagnostic(view);
    const position = view.state.selection.ranges[0]?.from;

    if (position === undefined) {
      return;
    }

    view.dispatch({
      effects: [
        // Scroll to the position with a buffer
        EditorView.scrollIntoView(position, {
          yMargin: SCROLL_BUFFER,
        }),
      ],
    });
  };

  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === "warning");

  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");

  const isValid = errors.length + warnings.length === 0;

  return (
    // TODO: Better tooltip name
    isValid ? (
      <Button ghost color="gray" disabled={true}>
        <CheckCircledIcon />
        {/* Zero width space to ensure full height*/}
        &#8203;
      </Button>
    ) : (
      <Tooltip content="Go to next issue">
        <Button ghost color="gray" disabled={isValid} onClick={handleGoToNextDiagnostic}>
          {errors.length !== 0 && (
            <>
              <CrossCircledIcon />
              {errors.length}
            </>
          )}
          {warnings.length !== 0 && (
            <>
              <ExclamationTriangleIcon />
              {warnings.length}
            </>
          )}
        </Button>
      </Tooltip>
    )
  );
};
