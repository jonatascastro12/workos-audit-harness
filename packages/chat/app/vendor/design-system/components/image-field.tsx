"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import classNames from "classnames";
import { useCallbackRef, useControllableState } from "radix-ui/internal";
import * as React from "react";
import { createContext } from "../helpers/create-context.js";
import { extractProps } from "../helpers/themes.js";
import { useIsomorphicLayoutEffect } from "../helpers/use-isomorphic-layout-effect.js";
import { useObjectUrl } from "../helpers/use-object-url.js";
import { marginPropDefs, MarginProps } from "../props.js";
import { Flex } from "./flex.js";
import { Text } from "./text.js";

const defaultMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/webp",
  "image/avif",
  // .ico has two MIME types
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;

export type ImageFieldMimeType = (typeof defaultMimeTypes)[number];

export type ImageFieldError =
  | "aspect-ratio-incorrect"
  | "dimensions-too-large"
  | "dimensions-too-small"
  | "file-size-too-large"
  | "file-unreadable"
  | "format-unacceptable";

interface ImageFieldContextValue {
  file: File | string | null;
  handleClear: () => void;
  handleChangeStart: () => void;
}

const [ImageFieldProvider, useImageFieldContext] =
  createContext<ImageFieldContextValue>("ImageField");

interface ImageFieldOwnProps {
  defaultFile?: File | string | null;
  file?: File | string | null;
  onFileChange?: (file: File | null) => void;
  onError?: (errors: ImageFieldError[]) => void;
  name?: string;
  placeholder?: string;
  ratio?: number;
  accept?: ImageFieldMimeType[] | readonly ImageFieldMimeType[];
  maxSizeKB?: number;
  maxDimensions?: { width: number; height: number };
  minDimensions?: { width: number; height: number };
  state?: "normal" | "disabled" | "read-only";
}

type ImageFieldContainerProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onError" | "onErrorCapture" | "color"
>;

interface ImageFieldProps extends ImageFieldOwnProps, ImageFieldContainerProps, MarginProps {}

const ImageFieldRoot = React.forwardRef<HTMLDivElement, ImageFieldProps>((props, forwardedRef) => {
  const {
    id,
    name,
    className,
    placeholder = "Upload image",
    accept = defaultMimeTypes,
    ratio,
    children,
    maxDimensions,
    maxSizeKB,
    minDimensions,
    state = "normal",
    defaultFile: defaultFileProp,
    file: fileProp,
    onFileChange,
    onError = () => null,
    onClick,
    ...rootProps
  } = extractProps(props, marginPropDefs);

  const prevFileValue = React.useRef<File | string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputResetKey, setInputResetKey] = React.useState(0);
  const [draggingOver, setDraggingOver] = React.useState(false);

  const [file, setFile] = useControllableState({
    prop: fileProp,
    // Introducing lint rule banning type assertions
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    onChange: onFileChange as (file: File | string | null) => void,
    defaultProp: defaultFileProp ?? null,
  });

  const handleChangeStart = React.useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.click();
  }, []);

  const handleClear = React.useCallback(() => {
    onError([]);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onError, setFile]);

  let ariaDescription: string | undefined;

  if (typeof file === "string") {
    ariaDescription = "Previous file will be used. Press backspace to clear.";
  } else if (file) {
    ariaDescription = "Press backspace to clear.";
  }

  React.useEffect(
    function clearInputOnFileChange() {
      // Clear the input if the controlled state goes from a value to null
      if (file === null && prevFileValue.current !== null) {
        handleClear();
      }

      prevFileValue.current = file;
    },
    [file, handleClear],
  );

  return (
    <ImageFieldProvider
      file={file ?? null}
      handleChangeStart={handleChangeStart}
      handleClear={handleClear}
    >
      <div
        ref={forwardedRef}
        className={classNames(className, "ImageFieldRoot")}
        data-state={state}
        onDragEnter={() => setDraggingOver(true)}
        onDragLeave={() => setDraggingOver(false)}
        {...rootProps}
      >
        <input
          key={inputResetKey}
          ref={inputRef}
          accept={accept.join()}
          aria-description={ariaDescription}
          className="ImageFieldInput"
          data-dragging-over={draggingOver || undefined}
          disabled={state === "disabled"}
          id={id}
          multiple={false}
          name={name}
          readOnly={state === "read-only"}
          title="" // Hide the native tooltip
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];

            // We wont't get `onDragLeave` when the file is "dropped"
            setDraggingOver(false);

            if (!file) {
              // User cancelled image upload in the native dialog
              return;
            }

            // Reset the input so re-selecting the same file triggers a
            // new change event. We clear the value AND bump the key so
            // React replaces the element entirely on the next render.
            event.target.value = "";
            setInputResetKey((k) => k + 1);

            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onerror = () => {
              // We were unable to convert the file to base64,
              // e.g. this could have been an insanely large file
              onError?.(["file-unreadable"]);
            };

            reader.onload = (event) => {
              if (typeof event.target?.result === "string") {
                const result = event.target.result;
                const img = new Image();
                img.src = result;

                img.onerror = () => {
                  // We've been tricked, it's not an image
                  onError?.(["format-unacceptable"]);
                };

                img.onload = () => {
                  const errors: ImageFieldError[] = [];
                  const imgRatio = (img.width / img.height).toFixed(2);
                  const isWrongRatio = imgRatio !== ratio?.toFixed(2);

                  // Introducing lint rule banning type assertions
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  if (!accept.includes(file.type as ImageFieldMimeType)) {
                    errors.push("format-unacceptable");
                  }

                  if (ratio && isWrongRatio) {
                    errors.push("aspect-ratio-incorrect");
                  }

                  if (maxSizeKB && file.size / 1024 > maxSizeKB) {
                    errors.push("file-size-too-large");
                  }

                  if (file.type !== "image/svg+xml") {
                    const minWidth = minDimensions?.width ?? 0;
                    const minHeight = minDimensions?.height ?? 0;
                    const maxWidth = maxDimensions?.width ?? Infinity;
                    const maxHeight = maxDimensions?.height ?? Infinity;

                    if (img.width < minWidth || img.height < minHeight) {
                      errors.push("dimensions-too-small");
                    }

                    if (img.width > maxWidth || img.height > maxHeight) {
                      errors.push("dimensions-too-large");
                    }
                  }

                  // If errors are empty, we just reset them (desired!)
                  onError?.(errors);

                  if (errors.length === 0) {
                    setFile(file);
                  }
                };
              } else {
                // This code path shouldn't be a thing, but just to be sure
                onError?.(["file-unreadable"]);
              }
            };
          }}
          onClick={(event) => {
            // Native input type="file" does not implement a read-only state
            if (state === "read-only") {
              event?.preventDefault();
            }

            // Clear the input value before the file picker opens so
            // re-selecting the same file still triggers onChange.
            event.currentTarget.value = "";

            onClick?.(event);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              handleClear();
            }
          }}
        />
        <div className="ImageFieldOutline" />

        {!file && (
          <Flex align="center" direction="column" gap="2" m="4">
            <Text align="center" className="ImageFieldPlaceholder" size="1">
              {placeholder}
            </Text>
          </Flex>
        )}

        {children}
      </div>
    </ImageFieldProvider>
  );
});

ImageFieldRoot.displayName = "ImageFieldRoot";

interface ImageFieldPreviewProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  backgroundColor?: string;
  onSrcChange?: (src?: string) => void;
  children?: (src: string) => React.ReactNode;
  src?: string | null;
}

const ImageFieldPreview = React.forwardRef<HTMLDivElement, ImageFieldPreviewProps>(
  (
    { backgroundColor, onSrcChange: onSrcChangeProp, children, style, src: srcProp, ...props },
    forwardedRef,
  ) => {
    const context = useImageFieldContext("ImageField");
    const onSrcChange = useCallbackRef(onSrcChangeProp);
    const src = useObjectUrl(srcProp ? null : context.file);
    const previewSrc = srcProp ?? src;

    useIsomorphicLayoutEffect(() => {
      onSrcChange?.(previewSrc ?? undefined);
    }, [previewSrc]);

    if (!previewSrc) {
      return null;
    }

    return (
      <div
        ref={forwardedRef}
        aria-hidden
        className="ImageFieldPreview"
        style={{ backgroundColor, ...style }}
        {...props}
      >
        <div className="ImageFieldPreviewInner">
          {children ? (
            children(previewSrc)
          ) : (
            <img className="ImageFieldPreviewImage" src={previewSrc} />
          )}
        </div>

        <div className="ImageFieldPreviewOverlay">
          <button
            className="rt-reset ImageFieldPreviewButton"
            tabIndex={-1}
            type="button"
            onClick={() => context.handleChangeStart()}
          >
            Change
          </button>

          <button
            aria-label="Clear"
            className="rt-reset ImageFieldPreviewIconButton"
            tabIndex={-1}
            type="button"
            onClick={() => context.handleClear()}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    );
  },
);

ImageFieldPreview.displayName = "ImageFieldPreview";

export const Root = ImageFieldRoot;
export const Preview = ImageFieldPreview;

export type { ImageFieldError as Error, ImageFieldMimeType as MimeType };
