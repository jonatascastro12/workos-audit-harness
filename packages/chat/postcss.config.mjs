import path from "node:path";

const config = {
  plugins: {
    "postcss-import": {},
    [path.resolve(process.cwd(), "app/vendor/design-system/postcss-workds.cjs")]: {},
    "postcss-hover-media-feature": {},
    "postcss-custom-media": {},
  },
};

export default config;
