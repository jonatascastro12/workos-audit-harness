import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINATION = join(ROOT, "app/vendor/design-system");
const SOURCE_ROOT_FILES = [
  "postcss-workds.cjs",
  "styles.css",
  "syntax-highlighting.css",
  "theme.css",
];
const SOURCE_SRC_FILES = [
  "breakpoints.css",
  "fonts.css",
  "overrides.css",
  "index.ts",
  "props.ts",
  "reset.css",
  "components",
  "generated",
  "helpers",
  "icons.ts",
  "recipes",
  "types",
];

const source = resolve(process.argv[2] ?? "../workos/packages/design-system");

if (!existsSync(source)) {
  throw new Error(
    `Design system source not found at ${source}. Pass the path to workos/packages/design-system.`,
  );
}

rmSync(DESTINATION, { force: true, recursive: true });
mkdirSync(DESTINATION, { recursive: true });

for (const file of SOURCE_ROOT_FILES) {
  cpSync(join(source, file), join(DESTINATION, file), { recursive: true });
}

for (const file of SOURCE_SRC_FILES) {
  cpSync(join(source, "src", file), join(DESTINATION, file), { recursive: true });
}

rewriteStylesheetImports(join(DESTINATION, "styles.css"));
rewritePostcssWorkds(join(DESTINATION, "postcss-workds.cjs"));

console.log(`Synced WorkDS from ${source}`);

function rewriteStylesheetImports(path) {
  const contents = readFileSync(path, "utf8").replaceAll("src/", "./");
  writeFileSync(path, contents);
}

function rewritePostcssWorkds(path) {
  const contents = readFileSync(path, "utf8").replace(
    "path.resolve('../design-system/src/breakpoints.css')",
    "path.resolve(__dirname, 'breakpoints.css')",
  );
  writeFileSync(path, contents);
}
