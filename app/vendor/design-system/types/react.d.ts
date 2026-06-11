// The import is needed
import "react";

declare module "react" {
  interface CSSProperties {
    [varName: `--${string}`]: string | number | undefined | null;
  }
}
