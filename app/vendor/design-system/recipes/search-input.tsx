import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { composeRefs } from "radix-ui/internal";
import * as React from "react";
import { Box } from "../components/box.js";
import { Spinner } from "../components/spinner.js";
import { Root as TextFieldRoot, Slot as TextFieldSlot } from "../components/text-field.js";

interface SearchInputProps extends React.ComponentPropsWithoutRef<typeof TextFieldRoot> {
  onValueChange: (value: string) => void;
  loading: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, Readonly<SearchInputProps>>(
  ({ onValueChange, autoComplete = "off", loading = false, children, ...props }, forwardedRef) => {
    const ref = React.useRef<HTMLInputElement>(null);
    const [showSpinner, setShowSpinner] = React.useState(loading);
    const showSpinnerTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    React.useEffect(() => {
      if (loading && document.activeElement === ref.current) {
        showSpinnerTimeoutRef.current = setTimeout(() => {
          setShowSpinner(true);
        }, 1000);
      } else {
        setShowSpinner(false);
        if (showSpinnerTimeoutRef.current) {
          clearTimeout(showSpinnerTimeoutRef.current);
        }
      }

      return () => clearTimeout(showSpinnerTimeoutRef.current);
    }, [loading]);

    return (
      <Box flexGrow="1">
        <TextFieldRoot
          ref={composeRefs(ref, forwardedRef)}
          autoComplete={autoComplete}
          id="search"
          name="search"
          type="search"
          onChange={(event) => onValueChange(event.target.value)}
          {...props}
        >
          <TextFieldSlot>
            {showSpinner ? <Spinner /> : <MagnifyingGlassIcon height="16" width="16" />}
          </TextFieldSlot>
          {children && <TextFieldSlot>{children}</TextFieldSlot>}
        </TextFieldRoot>
      </Box>
    );
  },
);

SearchInput.displayName = "SearchInput";
