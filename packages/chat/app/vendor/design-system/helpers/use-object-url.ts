import * as React from "react";

type ObjectUrlSource = string | null | File | Blob | MediaSource | undefined;

export function useObjectUrl(source: ObjectUrlSource) {
  const [objectURL, setObjectURL] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isPrimitiveSource(source)) {
      return;
    }

    const url = URL.createObjectURL(source);
    setObjectURL(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [source]);

  return isPrimitiveSource(source) ? (source ?? null) : objectURL;
}

const isPrimitiveSource = (source: ObjectUrlSource): source is string | undefined | null =>
  !source || typeof source === "string";
